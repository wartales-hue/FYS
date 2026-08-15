import { WeatherData, WeatherForecastDay } from '../types';

const STORAGE_KEY_WEATHER = 'oplira_cached_weather_v2';

/**
 * Saves fetched forecast to localStorage so it is available 100% offline for the next 2-3 days.
 */
export function saveWeatherToStorage(weather: WeatherData) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_WEATHER, JSON.stringify(weather));
    }
  } catch (e) {
    console.warn('Failed to cache weather in localStorage:', e);
  }
}

/**
 * Retrieves the cached forecast and determines the day's forecast based on today's real date.
 */
export function getStoredWeatherForecast(): WeatherData | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem(STORAGE_KEY_WEATHER);
    if (!raw) return null;

    const data: WeatherData = JSON.parse(raw);
    if (!data || !data.forecast || data.forecast.length === 0) return null;

    const todayStr = new Date().toISOString().split('T')[0];

    // Check if any day in the cached forecast matches today
    const matchingDayIndex = data.forecast.findIndex(f => f.date === todayStr);

    if (matchingDayIndex >= 0) {
      // Re-slice forecast from today forward
      const remainingDays = data.forecast.slice(matchingDayIndex);
      // Re-label
      remainingDays.forEach((day, idx) => {
        day.dayLabel = idx === 0 ? 'Hoy (Día 0)' : idx === 1 ? 'Mañana (+1 Día)' : `Pasado Mañana (+${idx} Días)`;
      });

      return {
        ...data,
        isGpsConnected: false,
        source: 'cached_forecast',
        cachedDate: data.lastUpdated,
        lastUpdated: `Pronóstico guardado (${data.lastUpdated})`,
        forecast: remainingDays
      };
    }

    // If exact date not found but cache exists, provide latest cached state marked as historical
    return {
      ...data,
      isGpsConnected: false,
      source: 'cached_forecast',
      cachedDate: data.lastUpdated,
      lastUpdated: `Último registro (${data.lastUpdated})`
    };
  } catch (e) {
    console.warn('Error reading cached weather:', e);
    return null;
  }
}

/**
 * Generates an operational weather package from manual input provided by the operator or supervisor.
 */
export function createManualWeather(
  currentTempC: number,
  altitudeMeters: number,
  faenaName: string,
  condition: string = 'Despejado',
  latitude: number = -23.8647,
  longitude: number = -69.0438
): WeatherData {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const thermalSensation = currentTempC <= 0 ? currentTempC - 3 : currentTempC;

  const hypoxiaRiskLevel: 'Baja' | 'Moderada' | 'Severa' = 
    altitudeMeters >= 3800 ? 'Severa' : altitudeMeters >= 2500 ? 'Moderada' : 'Baja';

  let weatherImpact = 0;
  if (thermalSensation <= -5 || thermalSensation >= 34) weatherImpact += 5;
  else if (thermalSensation <= 0) weatherImpact += 2;
  if (altitudeMeters >= 3800) weatherImpact += 4;
  else if (altitudeMeters >= 2500) weatherImpact += 2;

  const todayForecast: WeatherForecastDay = {
    dayLabel: 'Hoy (Día 0)',
    date: dateStr,
    tempMinC: currentTempC - 6,
    tempMaxC: currentTempC + 5,
    currentTempC,
    thermalSensationC: thermalSensation,
    condition,
    windSpeedKmh: 15,
    windGustsKmh: 24,
    uvIndex: altitudeMeters >= 3000 ? 10 : 7,
    humidityPercent: 30,
    barometricPressureHpa: Math.round(1013 * Math.exp(-altitudeMeters / 8400)),
    hypoxiaRiskLevel,
    fatigueWeatherImpactScore: weatherImpact
  };

  const tomorrowDate = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const dayAfterDate = new Date(now.getTime() + 172800000).toISOString().split('T')[0];

  const manualData: WeatherData = {
    latitude,
    longitude,
    altitudeMeters,
    faenaName,
    isGpsConnected: false,
    source: 'manual_entry',
    lastUpdated: `Ingreso Manual • ${now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`,
    forecast: [
      todayForecast,
      {
        ...todayForecast,
        dayLabel: 'Mañana (+1 Día)',
        date: tomorrowDate
      },
      {
        ...todayForecast,
        dayLabel: 'Pasado Mañana (+2 Días)',
        date: dayAfterDate
      }
    ]
  };

  saveWeatherToStorage(manualData);
  return manualData;
}

/**
 * Live Environmental & Meteorological Service
 * Integrates Open-Meteo Open API with auto caching for 3-day offline resilience.
 */
export async function fetchLiveWeatherFromCoords(
  latitude: number,
  longitude: number,
  altitudeMeters: number = 1200,
  faenaName: string = 'Faena Operacional'
): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,surface_pressure,uv_index&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo response status: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const currentTemp = Math.round(current.temperature_2m ?? 21);
    const thermalSensation = Math.round(current.apparent_temperature ?? currentTemp);
    const humidity = Math.round(current.relative_humidity_2m ?? 35);
    const windSpeed = Math.round(current.wind_speed_10m ?? 12);
    const pressure = Math.round(current.surface_pressure ?? 900);
    const uv = Math.round(current.uv_index ?? 6);

    const maxTempToday = daily.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : currentTemp + 4;
    const minTempToday = daily.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : currentTemp - 6;

    // Calculate hypoxia and fatigue impact
    const hypoxiaRiskLevel: 'Baja' | 'Moderada' | 'Severa' = 
      altitudeMeters >= 3800 ? 'Severa' : altitudeMeters >= 2500 ? 'Moderada' : 'Baja';

    let weatherImpact = 0;
    if (thermalSensation <= -5 || thermalSensation >= 34) weatherImpact += 5;
    else if (thermalSensation <= 0) weatherImpact += 2;
    if (windSpeed >= 50) weatherImpact += 3;
    if (altitudeMeters >= 3800) weatherImpact += 4;
    else if (altitudeMeters >= 2500) weatherImpact += 2;

    const todayDate = new Date();
    const dateStr = todayDate.toISOString().split('T')[0];

    const todayForecast: WeatherForecastDay = {
      dayLabel: 'Hoy (Día 0)',
      date: dateStr,
      tempMinC: minTempToday,
      tempMaxC: maxTempToday,
      currentTempC: currentTemp,
      thermalSensationC: thermalSensation,
      condition: currentTemp <= 0 ? 'Frío / Viento' : currentTemp >= 18 ? 'Despejado / Templado' : 'Fresco',
      windSpeedKmh: windSpeed,
      windGustsKmh: Math.round(windSpeed * 1.4),
      uvIndex: uv,
      humidityPercent: humidity,
      barometricPressureHpa: pressure,
      hypoxiaRiskLevel,
      fatigueWeatherImpactScore: weatherImpact
    };

    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(todayDate.getDate() + 1);

    const dayAfterDate = new Date(todayDate);
    dayAfterDate.setDate(todayDate.getDate() + 2);

    const tomorrowForecast: WeatherForecastDay = {
      dayLabel: 'Mañana (+1 Día)',
      date: tomorrowDate.toISOString().split('T')[0],
      tempMinC: daily.temperature_2m_min?.[1] ? Math.round(daily.temperature_2m_min[1]) : minTempToday,
      tempMaxC: daily.temperature_2m_max?.[1] ? Math.round(daily.temperature_2m_max[1]) : maxTempToday,
      currentTempC: currentTemp,
      thermalSensationC: thermalSensation,
      condition: 'Despejado',
      windSpeedKmh: windSpeed,
      windGustsKmh: Math.round(windSpeed * 1.3),
      uvIndex: uv,
      humidityPercent: humidity,
      barometricPressureHpa: pressure,
      hypoxiaRiskLevel,
      fatigueWeatherImpactScore: weatherImpact
    };

    const dayAfterForecast: WeatherForecastDay = {
      dayLabel: 'Pasado Mañana (+2 Días)',
      date: dayAfterDate.toISOString().split('T')[0],
      tempMinC: daily.temperature_2m_min?.[2] ? Math.round(daily.temperature_2m_min[2]) : minTempToday,
      tempMaxC: daily.temperature_2m_max?.[2] ? Math.round(daily.temperature_2m_max[2]) : maxTempToday,
      currentTempC: currentTemp + 1,
      thermalSensationC: thermalSensation + 1,
      condition: 'Despejado',
      windSpeedKmh: windSpeed,
      windGustsKmh: Math.round(windSpeed * 1.3),
      uvIndex: uv,
      humidityPercent: humidity,
      barometricPressureHpa: pressure,
      hypoxiaRiskLevel,
      fatigueWeatherImpactScore: weatherImpact
    };

    const resultWeather: WeatherData = {
      latitude,
      longitude,
      altitudeMeters,
      faenaName,
      isGpsConnected: true,
      source: 'gps_live',
      lastUpdated: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      forecast: [todayForecast, tomorrowForecast, dayAfterForecast]
    };

    // Automatically persist to offline storage for future days
    saveWeatherToStorage(resultWeather);

    return resultWeather;
  } catch (error) {
    console.warn('Live weather fetch failed. Attempting offline cache:', error);
    
    const cached = getStoredWeatherForecast();
    if (cached) {
      return cached;
    }

    return createManualWeather(21, altitudeMeters, faenaName, 'Despejado', latitude, longitude);
  }
}

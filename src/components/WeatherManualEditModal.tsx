import React, { useState } from 'react';
import { WeatherData, WeatherForecastDay } from '../types';
import { Thermometer, Mountain, MapPin, CloudSun, Wind, Droplets, Sun, Gauge, RefreshCw, AlertCircle, Save } from 'lucide-react';
import { fetchLiveWeatherFromCoords, saveWeatherToStorage } from '../lib/weatherService';

interface WeatherManualEditModalProps {
  currentWeather: WeatherData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWeather: WeatherData) => void;
}

export const WeatherManualEditModal: React.FC<WeatherManualEditModalProps> = ({
  currentWeather,
  isOpen,
  onClose,
  onSave
}) => {
  const firstDay = currentWeather.forecast?.[0];

  const [faenaName, setFaenaName] = useState(currentWeather.faenaName || 'Faena Operacional');
  const [altitudeMeters, setAltitudeMeters] = useState(currentWeather.altitudeMeters || 1240);
  const [temperatureC, setTemperatureC] = useState(firstDay?.currentTempC ?? 21);
  const [thermalSensationC, setThermalSensationC] = useState(firstDay?.thermalSensationC ?? 20);
  const [tempMinC, setTempMinC] = useState(firstDay?.tempMinC ?? 14);
  const [tempMaxC, setTempMaxC] = useState(firstDay?.tempMaxC ?? 25);
  const [windSpeedKmh, setWindSpeedKmh] = useState(firstDay?.windSpeedKmh ?? 15);
  const [humidityPercent, setHumidityPercent] = useState(firstDay?.humidityPercent ?? 35);
  const [uvIndex, setUvIndex] = useState(firstDay?.uvIndex ?? (altitudeMeters >= 3000 ? 10 : 6));
  const [condition, setCondition] = useState(firstDay?.condition || 'Despejado / Templado');
  
  const [gpsSyncLoading, setGpsSyncLoading] = useState(false);
  const [gpsSyncError, setGpsSyncError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLiveGpsFetch = () => {
    setGpsSyncLoading(true);
    setGpsSyncError(null);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const long = position.coords.longitude;
          const alt = position.coords.altitude ? Math.round(position.coords.altitude) : altitudeMeters;

          try {
            const live = await fetchLiveWeatherFromCoords(lat, long, alt, faenaName);
            setAltitudeMeters(alt);
            if (live.forecast?.[0]) {
              const d0 = live.forecast[0];
              setTemperatureC(d0.currentTempC);
              setThermalSensationC(d0.thermalSensationC);
              setTempMinC(d0.tempMinC);
              setTempMaxC(d0.tempMaxC);
              setWindSpeedKmh(d0.windSpeedKmh);
              setHumidityPercent(d0.humidityPercent);
              setUvIndex(d0.uvIndex);
              setCondition(d0.condition);
            }
            setGpsSyncLoading(false);
          } catch (e) {
            setGpsSyncError('No se pudo conectar con la estación meteorológica en vivo. Puedes ajustar los valores manualmente.');
            setGpsSyncLoading(false);
          }
        },
        (err) => {
          setGpsSyncError('Señal GPS no disponible o permiso denegado. Ingresa los parámetros manualmente.');
          setGpsSyncLoading(false);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      setGpsSyncError('Geolocalización no soportada en este dispositivo.');
      setGpsSyncLoading(false);
    }
  };

  const handleSave = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const tomorrowDate = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    const dayAfterDate = new Date(now.getTime() + 172800000).toISOString().split('T')[0];

    const hypoxiaRiskLevel: 'Baja' | 'Moderada' | 'Severa' = 
      altitudeMeters >= 3800 ? 'Severa' : altitudeMeters >= 2500 ? 'Moderada' : 'Baja';

    let weatherImpact = 0;
    if (thermalSensationC <= -5 || thermalSensationC >= 34) weatherImpact += 5;
    else if (thermalSensationC <= 0) weatherImpact += 2;
    if (windSpeedKmh >= 50) weatherImpact += 3;
    if (altitudeMeters >= 3800) weatherImpact += 4;
    else if (altitudeMeters >= 2500) weatherImpact += 2;

    const pressure = Math.round(1013 * Math.exp(-altitudeMeters / 8400));

    const todayForecast: WeatherForecastDay = {
      dayLabel: 'Hoy (Día 0)',
      date: dateStr,
      tempMinC: Number(tempMinC),
      tempMaxC: Number(tempMaxC),
      currentTempC: Number(temperatureC),
      thermalSensationC: Number(thermalSensationC),
      condition,
      windSpeedKmh: Number(windSpeedKmh),
      windGustsKmh: Math.round(Number(windSpeedKmh) * 1.4),
      uvIndex: Number(uvIndex),
      humidityPercent: Number(humidityPercent),
      barometricPressureHpa: pressure,
      hypoxiaRiskLevel,
      fatigueWeatherImpactScore: weatherImpact
    };

    const updatedData: WeatherData = {
      latitude: currentWeather.latitude,
      longitude: currentWeather.longitude,
      altitudeMeters: Number(altitudeMeters),
      faenaName,
      isGpsConnected: false,
      source: 'manual_entry',
      lastUpdated: `Ajuste Manual • ${now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`,
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

    saveWeatherToStorage(updatedData);
    onSave(updatedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Thermometer className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edición y Calibración de Datos Climáticos
                </h3>
                <p className="text-xs text-slate-500">
                  Valores alimentados desde GPS y pronóstico. Puedes modificarlos si consideras que no reflejan la realidad en terreno.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Editable Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Temperature */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-rose-500" />
              <span>Temperatura Actual (°C):</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="-40"
                max="55"
                value={temperatureC}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTemperatureC(val);
                  setThermalSensationC(val <= 0 ? val - 3 : val);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 font-mono font-bold text-slate-900 text-sm"
              />
              <span className="text-sm font-bold text-slate-600">°C</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              {temperatureC <= -5 ? '❄️ Frío severo (alerta térmica)' : temperatureC >= 32 ? '🔥 Calor extremo' : '🌤️ Temperatura operacional'}
            </span>
          </div>

          {/* Sensation */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              <span>Sensación Térmica (°C):</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="-45"
                max="60"
                value={thermalSensationC}
                onChange={(e) => setThermalSensationC(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 font-mono font-bold text-slate-900 text-sm"
              />
              <span className="text-sm font-bold text-slate-600">°C</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Percepción por viento y humedad
            </span>
          </div>

          {/* Min & Max Range */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>Rango Diario (Mín / Máx °C):</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Mín</span>
                <input
                  type="number"
                  value={tempMinC}
                  onChange={(e) => setTempMinC(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-xs font-bold text-slate-900"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Máx</span>
                <input
                  type="number"
                  value={tempMaxC}
                  onChange={(e) => setTempMaxC(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Altitude */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Mountain className="w-3.5 h-3.5 text-amber-600" />
              <span>Altitud Operacional (msnm):</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="6500"
                value={altitudeMeters}
                onChange={(e) => setAltitudeMeters(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 font-mono font-bold text-slate-900 text-sm"
              />
              <span className="text-xs font-bold text-slate-600">msnm</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              {altitudeMeters >= 3800 ? '⚠️ Gran Altitud (Hipoxia Severa)' : altitudeMeters >= 2500 ? '⚡ Altitud Moderada' : '✅ Nivel Seguro (<2500m)'}
            </span>
          </div>

          {/* Wind Speed */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-sky-600" />
              <span>Velocidad del Viento (km/h):</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="180"
                value={windSpeedKmh}
                onChange={(e) => setWindSpeedKmh(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 font-mono font-bold text-slate-900 text-sm"
              />
              <span className="text-xs font-bold text-slate-600">km/h</span>
            </div>
          </div>

          {/* Humidity & UV */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              <span>Humedad / Radiación UV:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={humidityPercent}
                  onChange={(e) => setHumidityPercent(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-xs font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500">%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">UV</span>
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={uvIndex}
                  onChange={(e) => setUvIndex(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Faena Name */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nombre de la Faena / Sector:</span>
            </label>
            <input
              type="text"
              value={faenaName}
              onChange={(e) => setFaenaName(e.target.value)}
              placeholder="Ej: Faena Operacional / Rajo Cordillera"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 text-xs font-medium"
            />
          </div>

          {/* Atmospheric Condition */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <CloudSun className="w-3.5 h-3.5 text-amber-500" />
              <span>Condición Meteorológica Visible:</span>
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 text-xs font-medium cursor-pointer"
            >
              <option value="Despejado / Templado">Despejado / Templado (Óptimo)</option>
              <option value="Despejado Altiplánico">Despejado Altiplánico (Alta Radiación UV)</option>
              <option value="Fresco">Fresco / Viento Moderado</option>
              <option value="Frío / Viento">Frío / Viento Cordillerano</option>
              <option value="Viento Blanco / Ráfagas">Viento Blanco / Ráfagas Severas</option>
              <option value="Escarcha Matinal">Escarcha Matinal / Hielo en Ruta</option>
              <option value="Nublado Cordillera">Nublado Cordillera</option>
            </select>
          </div>
        </div>

        {gpsSyncError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{gpsSyncError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLiveGpsFetch}
            disabled={gpsSyncLoading}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gpsSyncLoading ? 'animate-spin' : ''}`} />
            <span>{gpsSyncLoading ? 'Consultando GPS...' : 'Intentar GPS en Vivo'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar y Aplicar al Modelo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

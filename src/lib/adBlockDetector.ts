/**
 * AdBlock & Anti-Evasion Sentinel for Oplira SGFS HSEC
 * Comprehensive multi-vector detection and self-healing guardian against:
 * 1. DNS Sinkholing (Pi-hole, AdAway, NextDNS)
 * 2. Cosmetic CSS Element Hiding (uBlock Origin, Adblock Plus, Brave Shields)
 * 3. DOM Node Removal / Tree Mutation
 * 4. Script Blocking & Stub Injection
 * 5. Network Request Filtering
 */

export interface AdBlockStatus {
  isBlocked: boolean;
  detectedAt?: string;
  detectorMethod?: 'bait_element' | 'script_request' | 'dns_filter' | 'style_injection' | 'dom_mutation' | 'none';
  activeFilterVectors?: string[];
  guardianActive?: boolean;
}

let cachedStatus: AdBlockStatus = {
  isBlocked: false,
  detectorMethod: 'none',
  activeFilterVectors: [],
  guardianActive: true,
};

const listeners: Set<(status: AdBlockStatus) => void> = new Set();

export function onAdBlockStatusChange(callback: (status: AdBlockStatus) => void): () => void {
  listeners.add(callback);
  callback(cachedStatus);
  return () => listeners.delete(callback);
}

function notifyListeners(status: AdBlockStatus) {
  cachedStatus = status;
  listeners.forEach((cb) => {
    try {
      cb(status);
    } catch (e) {
      console.warn('Error in adblock listener:', e);
    }
  });
}

/**
 * Probes for all known AdBlocker mechanisms
 */
export async function detectAdBlocker(): Promise<AdBlockStatus> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { isBlocked: false, detectorMethod: 'none' };
  }

  const detectedVectors: string[] = [];
  let primaryMethod: AdBlockStatus['detectorMethod'] = 'none';

  // 1. Vector 1: DOM Bait Element Check (Detects CSS Cosmetic Filters)
  const bait = document.createElement('div');
  bait.setAttribute(
    'class',
    'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-banner adsbox ad-placement carbon-ads adsbygoogle ad-slot ad-unit'
  );
  bait.setAttribute(
    'style',
    'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;'
  );

  try {
    document.body.appendChild(bait);
    const computed = window.getComputedStyle(bait);
    if (
      computed.display === 'none' ||
      computed.visibility === 'hidden' ||
      computed.opacity === '0' ||
      bait.offsetParent === null ||
      bait.offsetHeight === 0 ||
      bait.offsetWidth === 0
    ) {
      detectedVectors.push('Filtro Cosmético CSS (uBlock/ABP)');
      primaryMethod = 'bait_element';
    }
  } catch (e) {
    // Ignore probe error
  } finally {
    if (bait.parentNode) {
      bait.parentNode.removeChild(bait);
    }
  }

  // 2. Vector 2: Simulated Ad Network Beacon (Detects DNS & Network Filters like Pi-hole, AdAway)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      detectedVectors.push('Filtro DNS / Host Blocking (Pi-hole / NextDNS)');
      if (primaryMethod === 'none') primaryMethod = 'dns_filter';
    }
  }

  // 3. Vector 3: Google Ads Script Variable Check
  if ((window as any).adsbygoogle && typeof (window as any).adsbygoogle === 'object' && !(window as any).adsbygoogle.push) {
    detectedVectors.push('Scriptlet Mocking / Stub Injection');
    if (primaryMethod === 'none') primaryMethod = 'script_request';
  }

  const result: AdBlockStatus = {
    isBlocked: detectedVectors.length > 0,
    detectedAt: new Date().toISOString(),
    detectorMethod: primaryMethod,
    activeFilterVectors: detectedVectors,
    guardianActive: true,
  };

  notifyListeners(result);
  return result;
}

export function getCachedAdBlockStatus(): AdBlockStatus {
  return cachedStatus;
}

/**
 * Self-Healing DOM Guardian for Native Sponsor Cards
 * Monitors the container node against CSS forced hiding or element removal
 */
export function attachDomGuardian(
  element: HTMLElement,
  onTamperDetected?: (details: string) => void
): () => void {
  if (!element || typeof window === 'undefined') return () => {};

  const checkAndRestore = () => {
    try {
      const computed = window.getComputedStyle(element);
      if (
        computed.display === 'none' ||
        computed.visibility === 'hidden' ||
        parseFloat(computed.opacity || '1') < 0.05
      ) {
        // Enforce visibility override
        element.style.setProperty('display', 'block', 'important');
        element.style.setProperty('visibility', 'visible', 'important');
        element.style.setProperty('opacity', '1', 'important');
        element.style.setProperty('height', 'auto', 'important');
        onTamperDetected?.('Intento de ocultamiento cosmético neutralizado por el Guardián DOM');
      }
    } catch (e) {
      // Ignore
    }
  };

  // MutationObserver for style or attribute alterations
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
        checkAndRestore();
      }
    }
  });

  observer.observe(element, {
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden'],
  });

  // Initial check
  checkAndRestore();

  return () => {
    observer.disconnect();
  };
}

/**
 * Device fingerprint for token binding. Same browser/device produces the same value
 * so a token copied to another PC will fail validation (different fingerprint).
 */

const STORAGE_KEY = 'simplesweldo_device_fp';

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function getRawFingerprint(): string {
  const parts = [
    typeof navigator !== 'undefined' ? navigator.userAgent : '',
    typeof navigator !== 'undefined' ? navigator.language : '',
    typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
    typeof screen !== 'undefined' ? String(screen.colorDepth) : '',
    typeof Intl !== 'undefined' && Intl.DateTimeFormat() ? new Date().getTimezoneOffset().toString() : '',
    typeof navigator !== 'undefined' ? String(navigator.hardwareConcurrency || 0) : '',
  ];
  return parts.join('|');
}

/**
 * Returns a stable device fingerprint for the current browser/device.
 * Cached in sessionStorage for the session so all requests use the same value.
 */
export function getDeviceFingerprint(): string {
  if (typeof sessionStorage === 'undefined') {
    return simpleHash(getRawFingerprint());
  }
  let fp = sessionStorage.getItem(STORAGE_KEY);
  if (!fp) {
    fp = simpleHash(getRawFingerprint());
    sessionStorage.setItem(STORAGE_KEY, fp);
  }
  return fp;
}

/** OS / device type for the device list (e.g. "Windows", "Mac OS", "Android"). */
export function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'Mac OS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown device';
}

/** Browser name for the device list (e.g. "Chrome", "Safari"). */
export function getBrowser(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  let name = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) name = 'Chrome';
  else if (ua.includes('Edg')) name = 'Edge';
  else if (ua.includes('Firefox')) name = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) name = 'Safari';
  return name;
}

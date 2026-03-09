// Utility to resolve the API base URL depending on environment
export function getBaseUrl(path = ''): string {
  // Normalize path to ensure no double slashes and no double /api
  const normalize = (base: string, p: string) => {
    if (!p) return base.replace(/\/$/, '');
    // Remove trailing slash from base and leading slash from path
    const cleanBase = base.replace(/\/$/, '');
    const cleanPath = p.replace(/^\//, '');
    // Prevent double /api if base already ends with /api and path starts with api
    if (cleanBase.endsWith('/api') && cleanPath.startsWith('api')) {
      return `${cleanBase}/${cleanPath.replace(/^api\/?/, '')}`;
    }
    return `${cleanBase}/${cleanPath}`;
  };

  if (import.meta.env.MODE === 'development') {
    return normalize(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', path);
  }
  if (typeof window !== 'undefined') {
    return normalize(window.location.origin, path);
  }
  return normalize('http://localhost:5000', path);
}

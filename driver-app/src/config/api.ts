import Constants from 'expo-constants';

const normalizeBaseUrl = (input: string) => {
  if (!input) {
    return undefined;
  }

  // Ensure we only have a single trailing /api segment
  const cleaned = input.endsWith('/') ? input.slice(0, -1) : input;
  return cleaned.match(/\/api$/) ? cleaned : `${cleaned}/api`;
};

const resolveHostFromExpo = () => {
  const possibleHosts = [
    Constants.expoConfig?.extra?.apiBaseUrl as string | undefined,
    process.env.EXPO_PUBLIC_API_BASE_URL,
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.hostUri,
    (Constants.manifest as any)?.debuggerHost,
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri,
  ].filter(Boolean) as string[];

  for (const candidate of possibleHosts) {
    if (!candidate) continue;

    if (candidate.startsWith('http')) {
      const normalized = normalizeBaseUrl(candidate);
      if (normalized) return normalized;
      continue;
    }

    const host = candidate.split(':')[0];
    if (host) {
      return `http://${host}:5000/api`;
    }
  }

  return undefined;
};

const getApiBaseUrl = () => {
  if (__DEV__) {
    const detected = resolveHostFromExpo();
    return (
      detected ||
      normalizeBaseUrl('http://192.168.43.114:5000') ||
      'http://localhost:5000/api'
    );
  }

  return (
    normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL ?? '') ||
    'https://your-production-api.com/api'
  );
};

export const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API Base URL:', API_BASE_URL);

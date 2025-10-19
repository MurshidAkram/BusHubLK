declare module 'expo-env' {
  export const API_URL: string;
}

declare global {
  const EXPO_PUBLIC_API_URL: string | undefined;
}
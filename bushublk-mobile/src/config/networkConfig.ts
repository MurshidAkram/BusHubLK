const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getDynamicBaseURL = () => {
  // Use environment variable from .env file
  if (API_URL) {
    console.log('📱 Using API URL from environment variable:', API_URL);
    return API_URL;
  }

  // Fallback to AWS hosted backend
  const awsUrl = 'http://43.205.127.30:5000';
  console.log('🚀 Using AWS Backend URL:', awsUrl);
  return awsUrl;
};

export const API_CONFIG = {
  baseURL: getDynamicBaseURL(),
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

import axios from 'axios';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web, or your local network IP
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    // If you are testing on a physical device, replace this with your machine's local IP Address (e.g. 192.168.1.100)
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }
  // Production URL
  return 'https://toolapp.nexopps.in';
};

export const BASE_URL = getBaseUrl();

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const binaryRequest = async (
  method: 'GET' | 'POST',
  endpoint: string,
  data?: any,
  headers: Record<string, string> = {}
): Promise<ArrayBuffer> => {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: { ...headers },
  };

  if (data) {
    if (data instanceof FormData) {
      options.body = data;
      // Do not manually set Content-Type for FormData with fetch,
      // as the runtime sets the boundary automatically.
      if (options.headers) {
        delete (options.headers as any)['Content-Type'];
      }
    } else {
      options.body = JSON.stringify(data);
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
      };
    }
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return await response.arrayBuffer();
};

export const uploadFile = async (
  endpoint: string, 
  fileUri: string, 
  fileName: string, 
  mimeType: string,
  additionalData?: Record<string, string | number | boolean>,
  additionalFiles?: Array<{ fieldName: string, uri: string, name: string, type: string }>
) => {
  const formData = new FormData();
  
  // @ts-ignore - React Native FormData expects this shape
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  });

  if (additionalFiles) {
    additionalFiles.forEach(f => {
      // @ts-ignore
      formData.append(f.fieldName, {
        uri: f.uri,
        name: f.name,
        type: f.type,
      });
    });
  }

  if (additionalData) {
    Object.keys(additionalData).forEach(key => {
      formData.append(key, String(additionalData[key]));
    });
  }

  return binaryRequest('POST', endpoint, formData);
};

export default client;

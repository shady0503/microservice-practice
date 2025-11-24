import axios from 'axios';
import { API_TIMEOUT } from '@/config/api.config';
import { tokenManager } from '../tokenManager';

const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: add auth token
  client.interceptors.request.use(
    (config) => {
      const token = tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: handle errors globally
  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;

        if (status === 401) {
          // Unauthorized: clear tokens and redirect to login
          tokenManager.clearTokens();
          window.location.href = '/login';
        }

        // Return error in consistent format
        return Promise.reject({
          status,
          message: data?.message || data?.error || 'An error occurred',
          errors: data?.errors || {},
        });
      } else if (error.request) {
        // Request made but no response received
        return Promise.reject({
          status: 0,
          message: 'Network error. Please check your connection.',
          errors: {},
        });
      } else {
        // Something else happened
        return Promise.reject({
          status: 0,
          message: error.message || 'An unexpected error occurred',
          errors: {},
        });
      }
    }
  );

  return client;
};

export default createApiClient;

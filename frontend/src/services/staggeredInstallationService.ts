import axios from 'axios';

const getApiBaseUrl = (): string => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  return `${window.location.protocol}//${window.location.host}/sync/api`;
};

const API_BASE_URL = getApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface CreateStaggeredInstallationPayload {
  account_no: string;
  staggered_install_no: string;
  staggered_date: string;
  staggered_balance: number;
  months_to_pay: number;
  monthly_payment: number;
  modified_by: string;
  modified_date: string;
  user_email: string;
  remarks?: string;
}

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

interface StaggeredInstallationResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export const staggeredInstallationService = {
  getAll: async (accountNo?: string): Promise<StaggeredInstallationResponse> => {
    try {
      const params = accountNo ? { account_no: accountNo } : {};
      const response = await axiosInstance.get<ApiResponse>('/staggered-installations', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error fetching staggered installations:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch staggered installations',
        data: []
      };
    }
  },

  create: async (payload: CreateStaggeredInstallationPayload): Promise<StaggeredInstallationResponse> => {
    try {
      const response = await axiosInstance.post<ApiResponse>('/staggered-installations', payload);
      return {
        success: true,
        message: response.data.message || 'Staggered installation created successfully',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error creating staggered installation:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create staggered installation',
        error: error.response?.data?.error
      };
    }
  },

  getById: async (id: string): Promise<StaggeredInstallationResponse> => {
    try {
      const response = await axiosInstance.get<ApiResponse>(`/staggered-installations/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error fetching staggered installation:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch staggered installation'
      };
    }
  },

  update: async (id: string, payload: Partial<CreateStaggeredInstallationPayload>): Promise<StaggeredInstallationResponse> => {
    try {
      const response = await axiosInstance.put<ApiResponse>(`/staggered-installations/${id}`, payload);
      return {
        success: true,
        message: response.data.message || 'Staggered installation updated successfully',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error updating staggered installation:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update staggered installation'
      };
    }
  },

  delete: async (id: string): Promise<StaggeredInstallationResponse> => {
    try {
      const response = await axiosInstance.delete<ApiResponse>(`/staggered-installations/${id}`);
      return {
        success: true,
        message: response.data.message || 'Staggered installation deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting staggered installation:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete staggered installation'
      };
    }
  }
};

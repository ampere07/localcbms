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

export interface DiscountData {
  account_id: number;
  discount_amount: number;
  remaining: number;
  status: 'Unused' | 'Used' | 'Permanent' | 'Monthly';
  processed_date: string;
  processed_by_user_id: number;
  approved_by_user_id: number;
  remarks?: string;
  invoice_used_id?: number;
  used_date?: string;
}

export interface DiscountResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export const create = async (data: DiscountData): Promise<DiscountResponse> => {
  try {
    const response = await axiosInstance.post<any>('/discounts', data);
    return {
      success: true,
      message: response.data.message,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error creating discount:', error);
    throw error;
  }
};

export const getAll = async (): Promise<DiscountResponse> => {
  try {
    const response = await axiosInstance.get<any>('/discounts');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error fetching discounts:', error);
    throw error;
  }
};

export const getById = async (id: number): Promise<DiscountResponse> => {
  try {
    const response = await axiosInstance.get<any>(`/discounts/${id}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error fetching discount:', error);
    throw error;
  }
};

export const update = async (id: number, data: Partial<DiscountData>): Promise<DiscountResponse> => {
  try {
    const response = await axiosInstance.put<any>(`/discounts/${id}`, data);
    return {
      success: true,
      message: response.data.message,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error updating discount:', error);
    throw error;
  }
};

export const remove = async (id: number): Promise<DiscountResponse> => {
  try {
    const response = await axiosInstance.delete<any>(`/discounts/${id}`);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error deleting discount:', error);
    throw error;
  }
};

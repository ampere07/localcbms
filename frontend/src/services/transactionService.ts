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

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

interface ApproveTransactionResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface CreateTransactionPayload {
  account_id?: number;
  transaction_type: string;
  received_payment: number;
  payment_date: string;
  date_processed: string;
  processed_by_user_id?: number;
  payment_method: string;
  reference_no: string;
  or_no: string;
  remarks?: string;
  status: string;
  image_url?: string;
}

interface CreateTransactionResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const transactionService = {
  approveTransaction: async (transactionId: string): Promise<ApproveTransactionResponse> => {
    try {
      const response = await axiosInstance.post<ApiResponse>(`/transactions/${transactionId}/approve`);
      return {
        success: true,
        message: response.data.message || 'Transaction approved successfully',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error approving transaction:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to approve transaction'
      };
    }
  },

  createTransaction: async (payload: CreateTransactionPayload): Promise<CreateTransactionResponse> => {
    try {
      const response = await axiosInstance.post<ApiResponse>('/transactions', payload);
      return {
        success: true,
        message: response.data.message || 'Transaction created successfully',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create transaction'
      };
    }
  },

  getAllTransactions: async (): Promise<any> => {
    try {
      const response = await axiosInstance.get<ApiResponse>('/transactions');
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0
      };
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch transactions',
        data: []
      };
    }
  },

  uploadTransactionImage: async (formData: FormData): Promise<any> => {
    try {
      const response = await axiosInstance.post<ApiResponse>('/transactions/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        message: response.data.message || 'Images uploaded successfully',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error uploading transaction images:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to upload images'
      };
    }
  }
};

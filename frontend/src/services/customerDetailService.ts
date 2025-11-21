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

export interface CustomerDetailData {
  id: number;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  fullName: string;
  emailAddress?: string;
  contactNumberPrimary: string;
  contactNumberSecondary?: string;
  address: string;
  location?: string;
  barangay?: string;
  city?: string;
  region?: string;
  addressCoordinates?: string;
  housingStatus?: string;
  referredBy?: string;
  desiredPlan?: string;
  houseFrontPictureUrl?: string;
  groupId?: number;
  groupName?: string;
  
  billingAccount?: {
    id: number;
    accountNo: string;
    dateInstalled?: string;
    billingDay: number;
    billingStatusId: number;
    accountBalance: number;
    balanceUpdateDate?: string;
  };
  
  technicalDetails?: {
    id: number;
    username?: string;
    usernameStatus?: string;
    connectionType?: string;
    routerModel?: string;
    routerModemSn?: string;
    ipAddress?: string;
    lcp?: string;
    nap?: string;
    port?: string;
    vlan?: string;
    lcpnap?: string;
    usageTypeId?: number;
  };
  
  createdAt?: string;
  updatedAt?: string;
}

interface CustomerDetailApiResponse {
  success: boolean;
  data?: CustomerDetailData;
  message?: string;
}

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

export const getCustomerDetail = async (accountNo: string): Promise<CustomerDetailData | null> => {
  try {
    console.log('Fetching customer detail for account:', accountNo);
    const response = await axiosInstance.get<CustomerDetailApiResponse>(`/customer-detail/${accountNo}`);
    
    console.log('Customer detail API response:', response.data);
    
    if (response.data?.success && response.data?.data) {
      const data = response.data.data;
      console.log('House front picture URL from API:', data.houseFrontPictureUrl);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    return null;
  }
};

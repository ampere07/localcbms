import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface PaymentResponse {
  status: string;
  reference_no?: string;
  payment_url?: string;
  payment_id?: string;
  amount?: number;
  message?: string;
}

export interface PaymentStatusResponse {
  status: string;
  payment?: {
    reference_no: string;
    amount: number;
    status: string;
    transaction_status: string;
    date_time: string;
  };
  message?: string;
}

export const paymentService = {
  createPayment: async (accountNo: string, amount: number): Promise<PaymentResponse> => {
    try {
      const authData = localStorage.getItem('authData');
      let token = '';
      
      if (authData) {
        const parsed = JSON.parse(authData);
        token = parsed.token || '';
      }

      const response = await axios.post<PaymentResponse>(
        `${API_BASE_URL}/payments/create`,
        {
          account_no: accountNo,
          amount: amount
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );

      return response.data as PaymentResponse;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Payment creation failed');
      }
      throw new Error('Network error. Please check your connection.');
    }
  },

  checkPaymentStatus: async (referenceNo: string): Promise<PaymentStatusResponse> => {
    try {
      const authData = localStorage.getItem('authData');
      let token = '';
      
      if (authData) {
        const parsed = JSON.parse(authData);
        token = parsed.token || '';
      }

      const response = await axios.post<PaymentStatusResponse>(
        `${API_BASE_URL}/payments/status`,
        {
          reference_no: referenceNo
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );

      return response.data as PaymentStatusResponse;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to check payment status');
      }
      throw new Error('Network error. Please check your connection.');
    }
  }
};

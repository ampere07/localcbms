import apiClient from '../config/api';

export interface Notification {
  id: number;
  customer_name: string;
  plan_name: string;
  status: string;
  created_at: string;
  formatted_date: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

interface AxiosErrorType {
  response?: {
    status: number;
    data: any;
  };
  message: string;
  isAxiosError: boolean;
}

const isAxiosError = (error: any): error is AxiosErrorType => {
  return error && error.isAxiosError === true;
};

export const notificationService = {
  async getRecentApplications(limit: number = 10): Promise<Notification[]> {
    try {
      const response = await apiClient.get<NotificationResponse>(`/notifications/recent-applications?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      if (isAxiosError(error)) {
        console.error('Failed to fetch notifications:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      } else {
        console.error('Failed to fetch notifications:', error);
      }
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
      return response.data.count || 0;
    } catch (error) {
      if (isAxiosError(error)) {
        console.error('Failed to fetch unread count:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      } else {
        console.error('Failed to fetch unread count:', error);
      }
      return 0;
    }
  }
};

export type { Notification as NotificationType };

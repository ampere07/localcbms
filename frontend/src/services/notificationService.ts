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

export const notificationService = {
  async getRecentApplications(limit: number = 10): Promise<Notification[]> {
    try {
      const response = await apiClient.get<NotificationResponse>(`/notifications/recent-applications?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }
};

export type { Notification as NotificationType };

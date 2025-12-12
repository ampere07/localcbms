import api from '../config/api';

export interface DarkModeResponse {
  success: boolean;
  message?: string;
  data?: {
    darkmode: 'active' | 'inactive';
  };
}

export const userSettingsService = {
  updateDarkMode: async (userId: number, darkmode: 'active' | 'inactive'): Promise<DarkModeResponse> => {
    const response = await api.post<DarkModeResponse>('/user-settings/darkmode', {
      user_id: userId,
      darkmode
    });
    return response.data;
  },

  getDarkMode: async (userId: number): Promise<DarkModeResponse> => {
    const response = await api.get<DarkModeResponse>(`/user-settings/${userId}/darkmode`);
    return response.data;
  }
};

import apiClient from '../config/api';

export interface Concern {
  id: number;
  concern_name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const concernService = {
  getAllConcerns: async (): Promise<Concern[]> => {
    try {
      console.log('Fetching concerns from API...');
      const response = await apiClient.get<ApiResponse<Concern[]>>('/concerns');
      console.log('Concerns API response:', response.data);
      
      if (response.data && response.data.data) {
        console.log('Concerns data:', response.data.data);
        return response.data.data;
      }
      
      console.warn('No concerns data in response');
      return [];
    } catch (error) {
      console.error('Error fetching concerns:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      return [];
    }
  },

  getConcernById: async (id: number): Promise<Concern | null> => {
    try {
      const response = await apiClient.get<ApiResponse<Concern>>(`/concerns/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching concern:', error);
      return null;
    }
  }
};

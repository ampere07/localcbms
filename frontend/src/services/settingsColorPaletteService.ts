import api from '../config/api';

export interface ColorPalette {
  id: number;
  palette_name: string;
  primary: string;
  secondary: string;
  accent: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

interface ColorPaletteCreateData {
  palette_name: string;
  primary: string;
  secondary: string;
  accent: string;
  updated_by?: string;
}

interface ColorPaletteResponse {
  data: ColorPalette;
}

export const settingsColorPaletteService = {
  getAll: async (): Promise<ColorPalette[]> => {
    const response = await api.get<ColorPalette[]>('/settings-color-palette');
    return response.data;
  },

  getActive: async (): Promise<ColorPalette | null> => {
    const response = await api.get<ColorPalette | null>('/settings-color-palette/active');
    return response.data;
  },

  create: async (data: ColorPaletteCreateData): Promise<ColorPalette> => {
    const response = await api.post<ColorPaletteResponse>('/settings-color-palette', data);
    return response.data.data;
  },

  update: async (id: number, data: ColorPaletteCreateData): Promise<ColorPalette> => {
    const response = await api.put<ColorPaletteResponse>(`/settings-color-palette/${id}`, data);
    return response.data.data;
  },

  updateStatus: async (id: number, status: 'active' | 'inactive'): Promise<ColorPalette> => {
    const response = await api.put<ColorPaletteResponse>(`/settings-color-palette/${id}/status`, { status });
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/settings-color-palette/${id}`);
  }
};

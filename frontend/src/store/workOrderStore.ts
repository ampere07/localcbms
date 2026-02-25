import { create } from 'zustand';
import { getWorkOrders } from '../services/workOrderService';
import { WorkOrder } from '../types/workOrder';

interface WorkOrderState {
    workOrders: WorkOrder[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    currentPage: number;

    fetchWorkOrders: (page?: number, limit?: number, search?: string, status?: string) => Promise<void>;
    refreshWorkOrders: (status?: string) => Promise<void>;
    silentRefresh: (status?: string) => Promise<void>;
}

export const useWorkOrderStore = create<WorkOrderState>((set, get) => ({
    workOrders: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    hasMore: true,
    currentPage: 1,

    fetchWorkOrders: async (page = 1, limit = 50, search = '', status = '') => {
        set({ isLoading: true, error: null });
        try {
            const response = await getWorkOrders(false, page, limit, search, status);

            if (response.success) {
                const newWorkOrders = response.workOrders || [];
                set((state) => ({
                    workOrders: page === 1 ? newWorkOrders : [...state.workOrders, ...newWorkOrders],
                    totalCount: response.pagination?.total_items || state.totalCount,
                    hasMore: response.pagination?.has_next ?? false,
                    currentPage: page,
                    isLoading: false
                }));
            } else {
                set({ error: response.message || 'Failed to fetch work orders', isLoading: false });
            }
        } catch (err: any) {
            set({ error: err.message || 'Error occurred while fetching work orders', isLoading: false });
        }
    },

    refreshWorkOrders: async (status?: string) => {
        set({ workOrders: [], currentPage: 1, hasMore: true });
        await get().fetchWorkOrders(1, 10000, '', status);
    },

    silentRefresh: async (status?: string) => {
        await get().fetchWorkOrders(1, 10000, '', status);
    }
}));

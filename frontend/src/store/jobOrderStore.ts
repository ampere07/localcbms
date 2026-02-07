import { create } from 'zustand';
import { getJobOrders } from '../services/jobOrderService';
import { JobOrder } from '../types/jobOrder';

interface JobOrderState {
    jobOrders: JobOrder[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    currentPage: number;

    fetchJobOrders: (page?: number, limit?: number, search?: string, assignedEmail?: string, silent?: boolean) => Promise<void>;
    refreshJobOrders: (assignedEmail?: string) => Promise<void>;
    silentRefresh: (assignedEmail?: string) => Promise<void>;
}

export const useJobOrderStore = create<JobOrderState>((set, get) => ({
    jobOrders: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    hasMore: true,
    currentPage: 1,

    fetchJobOrders: async (page = 1, limit = 50, search = '', assignedEmail?: string, silent = false) => {
        const { jobOrders } = get();
        if (page === 1 && (!silent || jobOrders.length === 0)) {
            set({ isLoading: true, error: null });
        }

        try {
            const fastResponse = await getJobOrders(true, page, limit, search, assignedEmail);

            if (fastResponse.success) {
                const newJobOrders = fastResponse.jobOrders || [];

                set((state) => ({
                    jobOrders: page === 1 ? newJobOrders : [...state.jobOrders, ...newJobOrders],
                    hasMore: fastResponse.pagination?.has_more ?? false,
                    currentPage: page,
                    isLoading: false
                }));

                const fullResponse = await getJobOrders(false, page, limit, search, assignedEmail);

                if (fullResponse.success) {
                    const fullJobOrders = fullResponse.jobOrders || [];
                    set((state) => ({
                        jobOrders: page === 1
                            ? fullJobOrders
                            : state.jobOrders.map(jo => fullJobOrders.find(fjo => fjo.id === jo.id) || jo)
                    }));
                }
            }
        } catch (err: any) {
            set({ error: err.message || 'Failed to fetch job orders', isLoading: false });
        }
    },

    refreshJobOrders: async (assignedEmail?: string) => {
        set({ jobOrders: [], currentPage: 1, hasMore: true });
        await get().fetchJobOrders(1, 10000, '', assignedEmail, false);
    },

    silentRefresh: async (assignedEmail?: string) => {
        await get().fetchJobOrders(1, 10000, '', assignedEmail, true);
    }
}));

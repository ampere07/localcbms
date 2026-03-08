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

        // Only show loading if not silent OR if we have no data
        if (page === 1 && (!silent || jobOrders.length === 0)) {
            set({ isLoading: true, error: null });
        }

        try {
            // Fetch full data directly to avoid showing incomplete data first

            // Fetch full data for consistency (always runs)
            const fullResponse = await getJobOrders(false, page, limit, search, assignedEmail);

            if (fullResponse.success && fullResponse.jobOrders) {
                const fullJOs = fullResponse.jobOrders;
                set((state) => {
                    const currentMap = new Map();
                    // If not page 1, we preserve existing orders for infinite scroll
                    if (page !== 1) {
                        state.jobOrders.forEach(jo => currentMap.set(jo.id, jo));
                    }
                    fullJOs.forEach(jo => currentMap.set(jo.id, jo));

                    return {
                        jobOrders: Array.from(currentMap.values()).sort((a, b) => {
                            const idA = parseInt(String(a.id)) || 0;
                            const idB = parseInt(String(b.id)) || 0;
                            return idB - idA;
                        }),
                        totalCount: (fullResponse.pagination as any)?.total_count || (page === 1 ? fullJOs.length : state.totalCount),
                        hasMore: fullResponse.pagination?.has_more ?? false,
                        currentPage: page,
                        isLoading: false
                    };
                });
            }
        } catch (err: any) {
            console.error('[jobOrderStore] Fetch failed:', err);
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

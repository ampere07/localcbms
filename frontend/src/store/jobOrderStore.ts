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
    lastUpdated: Date | null;
 
    fetchJobOrders: (page?: number, limit?: number, search?: string, assignedEmail?: string, silent?: boolean) => Promise<void>;
    refreshJobOrders: (assignedEmail?: string) => Promise<void>;
    silentRefresh: (assignedEmail?: string) => Promise<void>;
    fetchUpdates: (assignedEmail?: string) => Promise<void>;
}

export const useJobOrderStore = create<JobOrderState>((set, get) => ({
    jobOrders: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    hasMore: true,
    currentPage: 1,
    lastUpdated: null,

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
                        lastUpdated: new Date(),
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
    },

    fetchUpdates: async (assignedEmail?: string) => {
        const { lastUpdated, jobOrders } = get();
        if (!lastUpdated) {
            await get().silentRefresh(assignedEmail);
            return;
        }

        try {
            // Format date for MySQL: YYYY-MM-DD HH:mm:ss
            const formattedDate = lastUpdated.toISOString().slice(0, 19).replace('T', ' ');
            console.log(`[JobOrderStore] Polling for updates since: ${formattedDate}`);

            const response = await getJobOrders(false, 1, 1000, '', assignedEmail, formattedDate);

            if (response.success && response.jobOrders && response.jobOrders.length > 0) {
                console.log(`[JobOrderStore] Received ${response.jobOrders.length} job order updates`);
                const updatedJOs = response.jobOrders;

                set((state) => {
                    const currentMap = new Map();
                    state.jobOrders.forEach(jo => currentMap.set(jo.id, jo));
                    
                    // Merge updates
                    updatedJOs.forEach(jo => {
                        const existing = currentMap.get(jo.id);
                        if (existing) {
                            // Merge fields to be safe, though item should be complete
                            currentMap.set(jo.id, { ...existing, ...jo });
                        } else {
                            currentMap.set(jo.id, jo);
                        }
                    });

                    return {
                        jobOrders: Array.from(currentMap.values()).sort((a: JobOrder, b: JobOrder) => {
                            const idA = parseInt(String(a.id)) || 0;
                            const idB = parseInt(String(b.id)) || 0;
                            return idB - idA;
                        }),
                        // If we have total_count in pagination, use it, otherwise estimate
                        totalCount: (response.pagination as any)?.total_count || 
                                   (state.totalCount + updatedJOs.filter(jo => !state.jobOrders.find(o => o.id === jo.id)).length),
                        lastUpdated: new Date()
                    };
                });
            } else {
                set({ lastUpdated: new Date() });
            }
        } catch (err) {
            console.error('[JobOrderStore] Polling failed:', err);
        }
    }
}));

import { create } from 'zustand';
import { getBillingRecords, BillingRecord } from '../services/billingService';

const CHUNK_SIZE = 1000;

interface BillingStore {
    billingRecords: BillingRecord[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    fetchBillingRecords: (force?: boolean) => Promise<void>;
    refreshBillingRecords: () => Promise<void>;
    silentRefresh: () => Promise<void>;
}

export const useBillingStore = create<BillingStore>((set, get) => ({
    billingRecords: [],
    totalCount: 0,
    isLoading: false,
    error: null,

    fetchBillingRecords: async (force = false) => {
        const { billingRecords, isLoading } = get();

        // If already loading or data already exists (and not forcing), skip
        if (isLoading || (billingRecords.length > 0 && !force)) return;

        set({ isLoading: true, error: null });

        try {
            // Initial fetch
            const result = await getBillingRecords(1, CHUNK_SIZE);

            const dbTotal = result.total || 0;
            let allFetchedRecords = result.data;

            set({
                billingRecords: allFetchedRecords,
                totalCount: dbTotal,
                isLoading: false
            });

            // Progressive background loading
            let currentPage = 2;
            let hasMore = result.hasMore;

            while (hasMore) {
                try {
                    console.log(`Progressive billing fetch: ${allFetchedRecords.length} / ${dbTotal}`);
                    const nextResult = await getBillingRecords(currentPage, CHUNK_SIZE);

                    if (nextResult && nextResult.data && nextResult.data.length > 0) {
                        allFetchedRecords = [...allFetchedRecords, ...nextResult.data];
                        set({
                            billingRecords: [...allFetchedRecords],
                            totalCount: nextResult.total || dbTotal
                        });

                        currentPage++;
                        hasMore = nextResult.hasMore;
                    } else {
                        hasMore = false;
                    }
                } catch (chunkErr) {
                    console.error('Error in progressive billing fetch:', chunkErr);
                    hasMore = false;
                }
            }
        } catch (err: any) {
            console.error('Error fetching billing records:', err);
            set({
                error: err.message || 'Failed to load records',
                isLoading: false
            });
        }
    },

    refreshBillingRecords: async () => {
        set({ billingRecords: [] });
        await get().fetchBillingRecords(true);
    },

    silentRefresh: async () => {
        if (get().billingRecords.length === 0) {
            get().fetchBillingRecords();
        }
    }
}));

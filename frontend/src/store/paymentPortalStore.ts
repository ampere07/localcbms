import { create } from 'zustand';
import { paymentPortalLogsService, PaymentPortalLog } from '../services/paymentPortalLogsService';

const CHUNK_SIZE = 2000;

interface PaymentPortalStore {
    paymentPortalRecords: PaymentPortalLog[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    fetchPaymentPortalRecords: (force?: boolean) => Promise<void>;
    refreshPaymentPortalRecords: () => Promise<void>;
    silentRefresh: () => Promise<void>;
}

export const usePaymentPortalStore = create<PaymentPortalStore>((set, get) => ({
    paymentPortalRecords: [],
    totalCount: 0,
    isLoading: false,
    error: null,

    fetchPaymentPortalRecords: async (force = false) => {
        const { paymentPortalRecords, isLoading } = get();

        // If already loading or data already exists (and not forcing), skip
        if (isLoading || (paymentPortalRecords.length > 0 && !force)) return;

        set({ isLoading: true, error: null });

        try {
            // Initial fetch
            const result = await paymentPortalLogsService.getAllLogs({
                limit: CHUNK_SIZE,
                offset: 0
            });

            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch initial payment portal logs');
            }

            const dbTotal = result.total || 0;
            let allFetchedRecords = [...result.data];

            set({
                paymentPortalRecords: allFetchedRecords,
                totalCount: dbTotal,
                isLoading: false
            });

            // Progressive background loading
            let currentOffset = CHUNK_SIZE;
            let hasMore = allFetchedRecords.length < dbTotal;

            while (hasMore) {
                try {
                    console.log(`Progressive payment portal fetch: ${currentOffset} / ${dbTotal}`);
                    const nextResult = await paymentPortalLogsService.getAllLogs({
                        limit: CHUNK_SIZE,
                        offset: currentOffset
                    });

                    if (nextResult && nextResult.success && nextResult.data && nextResult.data.length > 0) {
                        allFetchedRecords = [...allFetchedRecords, ...nextResult.data];
                        set({
                            paymentPortalRecords: [...allFetchedRecords],
                            totalCount: nextResult.total || dbTotal
                        });

                        currentOffset += CHUNK_SIZE;
                        hasMore = allFetchedRecords.length < dbTotal;
                    } else {
                        hasMore = false;
                    }
                } catch (chunkErr) {
                    console.error('Error in progressive payment portal fetch:', chunkErr);
                    hasMore = false;
                }
            }
        } catch (err: any) {
            console.error('Error fetching payment portal records:', err);
            set({
                error: err.message || 'Failed to load records',
                isLoading: false
            });
        }
    },

    refreshPaymentPortalRecords: async () => {
        set({ paymentPortalRecords: [] }); // Clear existing data
        await get().fetchPaymentPortalRecords(true);
    },

    silentRefresh: async () => {
        // Just triggers a background fetch if empty
        if (get().paymentPortalRecords.length === 0) {
            get().fetchPaymentPortalRecords();
        }
    }
}));

import { create } from 'zustand';
import { Transaction } from '../types/transaction';
import { transactionService } from '../services/transactionService';

interface TransactionState {
    transactions: Transaction[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    fetchTransactions: (force?: boolean, silent?: boolean) => Promise<void>;
    silentRefresh: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
    transactions: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    lastUpdated: null,

    fetchTransactions: async (force = false, silent = false) => {
        const { transactions, isLoading, totalCount } = get();

        // If explicitly forced, we reset
        const isInitialFetch = transactions.length === 0;

        // Only return if we already have all records and not forced
        if (!force && transactions.length >= totalCount && totalCount > 0) {
            return;
        }

        if (isLoading && !force) return;

        if (!silent && isInitialFetch) {
            set({ isLoading: true });
        }

        try {
            const CHUNK_SIZE = 2000; // Smaller chunk for smoother UI updates with 90k+ records
            let allFetchedRecords = force ? [] : [...transactions];
            let dbTotal = totalCount;
            let currentOffset = allFetchedRecords.length;

            // Fetch first/next chunk
            console.log(`Fetching transactions offset ${currentOffset}...`);
            const result = await transactionService.getAllTransactions(CHUNK_SIZE, currentOffset);

            if (result && result.success) {
                dbTotal = result.total || result.count || result.data.length;
                const newRecords = result.data;
                allFetchedRecords = [...allFetchedRecords, ...newRecords];

                set({
                    transactions: allFetchedRecords,
                    totalCount: dbTotal,
                    lastUpdated: new Date(),
                    error: null,
                    isLoading: false // Hide loader after first chunk or after force-refresh
                });

                // Progressive background loading if more remain
                let hasMore = allFetchedRecords.length < dbTotal;

                while (hasMore) {
                    currentOffset = allFetchedRecords.length;
                    console.log(`Progressive fetch: ${currentOffset} / ${dbTotal}`);

                    try {
                        const nextResult = await transactionService.getAllTransactions(CHUNK_SIZE, currentOffset);
                        if (nextResult && nextResult.success && nextResult.data && nextResult.data.length > 0) {
                            allFetchedRecords = [...allFetchedRecords, ...nextResult.data];
                            set({
                                transactions: [...allFetchedRecords],
                                totalCount: nextResult.total || dbTotal
                            });
                            hasMore = allFetchedRecords.length < dbTotal;
                        } else {
                            hasMore = false;
                        }
                    } catch (chunkErr) {
                        console.error('Error in progressive fetch:', chunkErr);
                        hasMore = false;
                    }
                }
            } else {
                throw new Error(result.message || 'Failed to fetch transactions');
            }
        } catch (err: any) {
            console.error('Failed to fetch transactions:', err);
            if (!silent && get().transactions.length === 0) {
                set({ error: 'Failed to load transactions. Please try again.' });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    silentRefresh: async () => {
        await get().fetchTransactions(true, true);
    },

    refreshTransactions: async () => {
        await get().fetchTransactions(true, false);
    }
}));

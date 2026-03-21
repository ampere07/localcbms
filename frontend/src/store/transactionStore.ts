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
    fetchUpdates: () => Promise<void>;
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
    },

    fetchUpdates: async () => {
        const { lastUpdated, transactions } = get();
        if (!lastUpdated) {
            await get().silentRefresh();
            return;
        }

        try {
            const formattedDate = lastUpdated.toISOString().slice(0, 19).replace('T', ' ');
            console.log(`[TransactionStore] Polling for updates since: ${formattedDate}`);

            const result = await transactionService.getAllTransactions(1000, 0, formattedDate);

            if (result && result.success && result.data && result.data.length > 0) {
                console.log(`[TransactionStore] Received ${result.data.length} transaction updates`);
                const updatedTransactions = result.data;

                set((state) => {
                    const currentMap = new Map();
                    state.transactions.forEach((t: Transaction) => currentMap.set(t.id, t));
                    
                    updatedTransactions.forEach((t: Transaction) => {
                        currentMap.set(t.id, t);
                    });

                    return {
                        transactions: Array.from(currentMap.values()).sort((a: any, b: any) => {
                            const dateA = new Date(a.created_at || a.payment_date || 0).getTime();
                            const dateB = new Date(b.created_at || b.payment_date || 0).getTime();
                            return dateB - dateA;
                        }),
                        totalCount: result.total || 
                                   (state.totalCount + updatedTransactions.filter((t: Transaction) => !state.transactions.find(o => o.id === t.id)).length),
                        lastUpdated: new Date()
                    };
                });
            } else {
                set({ lastUpdated: new Date() });
            }
        } catch (err) {
            console.error('[TransactionStore] Polling failed:', err);
        }
    }
}));

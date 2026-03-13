import { create } from 'zustand';
import { TransactionRevert, transactionRevertService } from '../services/transactionRevertService';

interface TransactionRevertState {
    revertRequests: TransactionRevert[];
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    fetchRevertRequests: (silent?: boolean) => Promise<void>;
    fetchUpdates: () => Promise<void>;
}

export const useTransactionRevertStore = create<TransactionRevertState>((set, get) => ({
    revertRequests: [],
    isLoading: false,
    error: null,
    lastUpdated: null,

    fetchRevertRequests: async (silent = false) => {
        if (!silent) set({ isLoading: true });
        try {
            const result = await transactionRevertService.getAllRevertRequests();
            if (result.success) {
                set({
                    revertRequests: result.data,
                    lastUpdated: new Date(),
                    error: null
                });
            } else {
                set({ error: 'Failed to load revert requests' });
            }
        } catch (err) {
            set({ error: 'An unexpected error occurred' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchUpdates: async () => {
        const { lastUpdated, revertRequests } = get();
        if (!lastUpdated) {
            await get().fetchRevertRequests(true);
            return;
        }

        try {
            const formattedDate = lastUpdated.toISOString().slice(0, 19).replace('T', ' ');
            const result = await transactionRevertService.getAllRevertRequests(formattedDate);

            if (result && result.success && result.data && result.data.length > 0) {
                const updatedRequests = result.data;
                
                set((state) => {
                    const currentMap = new Map();
                    state.revertRequests.forEach((r: TransactionRevert) => currentMap.set(r.id, r));
                    
                    updatedRequests.forEach((r: TransactionRevert) => {
                        currentMap.set(r.id, r);
                    });

                    return {
                        revertRequests: Array.from(currentMap.values()).sort((a: any, b: any) => {
                            const dateA = new Date(a.created_at || 0).getTime();
                            const dateB = new Date(b.created_at || 0).getTime();
                            return dateB - dateA;
                        }),
                        lastUpdated: new Date()
                    };
                });
            } else {
                set({ lastUpdated: new Date() });
            }
        } catch (err) {
            console.error('[TransactionRevertStore] Polling failed:', err);
        }
    }
}));

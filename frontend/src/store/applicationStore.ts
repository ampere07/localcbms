import { create } from 'zustand';
import { getApplications } from '../services/applicationService';
import { Application } from '../types/application';

const transformApplication = (app: Application): Application => {
    const addressLine = app.installation_address || app.address_line || app.address || '';

    return {
        ...app,
        customer_name: app.customer_name || `${app.first_name || ''} ${app.middle_initial || ''} ${app.last_name || ''}`.trim(),
        timestamp: app.timestamp || (app.create_date && app.create_time ? `${app.create_date} ${app.create_time}` : ''),
        address: addressLine,
        status: app.status || 'pending',
    };
};

interface ApplicationState {
    applications: Application[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    currentPage: number;
    lastSyncTime: string | null;

    fetchApplications: (search?: string, silent?: boolean, since?: string) => Promise<void>;
    refreshApplications: () => Promise<void>;
    silentRefresh: () => Promise<void>;
    addNotificationRecord: (app: Application) => void;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
    applications: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    hasMore: true,
    currentPage: 1,
    lastSyncTime: null,

    fetchApplications: async (search = '', silent = false, since?: string) => {
        const { applications, isLoading } = get();

        // If already loading and this is not a forced re-load, ignore
        if (isLoading) return;

        // Show loading if not silent OR if we have no data
        if (!silent || applications.length === 0) {
            set({ isLoading: true, error: null });
        }

        const CHUNK_SIZE = 1000;

        try {
            // Transform/Sort Helper
            const sortApplications = (apps: Application[]) => {
                return [...apps].sort((a, b) => {
                    const dateA = a.created_at || a.timestamp;
                    const dateB = b.created_at || b.timestamp;
                    const timeA = dateA ? new Date(dateA).getTime() : 0;
                    const timeB = dateB ? new Date(dateB).getTime() : 0;
                    if (timeA !== timeB) return timeB - timeA;
                    const idA = parseInt(a.id) || 0;
                    const idB = parseInt(b.id) || 0;
                    return idB - idA;
                });
            };

            // First chunk fetch
            const firstResult = await getApplications(false, 1, CHUNK_SIZE, search, since);

            if (!firstResult.success) {
                throw new Error(firstResult.message || 'Failed to fetch applications');
            }

            const dbTotal = firstResult.pagination?.total_count || firstResult.applications?.length || 0;
            let allFetchedRecords = (firstResult.applications || []).map(transformApplication);

            // Update state with first chunk
            set({
                applications: sortApplications(allFetchedRecords),
                totalCount: dbTotal,
                isLoading: false,
                lastSyncTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                hasMore: allFetchedRecords.length < dbTotal,
                currentPage: 1
            });

            // Progressive background loading
            let currentPageNum = 2;
            let hasMoreData = allFetchedRecords.length < dbTotal;

            while (hasMoreData) {
                try {
                    console.log(`[applicationStore] Progressive fetch: ${allFetchedRecords.length} / ${dbTotal}`);
                    const nextResult = await getApplications(false, currentPageNum, CHUNK_SIZE, search, since);

                    if (nextResult && nextResult.success && Array.isArray(nextResult.applications) && nextResult.applications.length > 0) {
                        const nextBatch = nextResult.applications.map(transformApplication);
                        allFetchedRecords = [...allFetchedRecords, ...nextBatch];

                        set({
                            applications: sortApplications(allFetchedRecords),
                            totalCount: nextResult.pagination?.total_count || dbTotal,
                            currentPage: currentPageNum,
                            hasMore: allFetchedRecords.length < dbTotal
                        });

                        currentPageNum++;
                        hasMoreData = allFetchedRecords.length < dbTotal;
                    } else {
                        hasMoreData = false;
                        set({ hasMore: false });
                    }
                } catch (chunkErr) {
                    console.error('[applicationStore] Chunk fetch error:', chunkErr);
                    hasMoreData = false;
                    set({ hasMore: false });
                }
            }
        } catch (err: any) {
            console.error('[applicationStore] Fetch failed:', err);
            set({ error: err.message || 'Failed to fetch applications', isLoading: false });
        }
    },

    refreshApplications: async () => {
        await get().fetchApplications('', false);
    },

    silentRefresh: async () => {
        await get().fetchApplications('', true);
    },

    addNotificationRecord: (app: Application) => {
        const transformed = transformApplication(app);
        set((state) => {
            const exists = state.applications.some(a => a.id === transformed.id);
            if (exists) return state; // Already in list

            return {
                applications: [transformed, ...state.applications].sort((a, b) => {
                    const dateA = a.created_at || a.timestamp;
                    const dateB = b.created_at || b.timestamp;
                    const timeA = dateA ? new Date(dateA).getTime() : 0;
                    const timeB = dateB ? new Date(dateB).getTime() : 0;
                    if (timeA !== timeB) return timeB - timeA;
                    const idA = parseInt(a.id) || 0;
                    const idB = parseInt(b.id) || 0;
                    return idB - idA;
                }),
                totalCount: state.totalCount + 1
            };
        });
    }
}));

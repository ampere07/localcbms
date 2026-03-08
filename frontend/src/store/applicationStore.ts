import { create } from 'zustand';
import { getApplications } from '../services/applicationService';
import { Application } from '../types/application';

const transformApplication = (app: Application): Application => {
    const regionName = app.region || '';
    const cityName = app.city || '';
    const barangayName = app.barangay || '';
    const addressLine = app.installation_address || app.address_line || app.address || '';
    const fullAddress = [regionName, cityName, barangayName, addressLine].filter(Boolean).join(', ');

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

    fetchApplications: (page?: number, limit?: number, search?: string, silent?: boolean) => Promise<void>;
    refreshApplications: () => Promise<void>;
    silentRefresh: () => Promise<void>;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
    applications: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    hasMore: true,
    currentPage: 1,

    fetchApplications: async (page = 1, limit = 50, search = '', silent = false) => {
        const { applications } = get();

        // Only show loading if not silent OR if we have no data
        if (page === 1 && (!silent || applications.length === 0)) {
            set({ isLoading: true, error: null });
        }

        try {
            // If silent refresh and we already have data, skip fast mode to avoid
            // overwriting complete data with incomplete (no region/barangay) data
            const skipFastMode = silent && applications.length > 0;

            if (!skipFastMode) {
                // Fetch fast data first (only for initial load or explicit refresh)
                const fastResponse = await getApplications(true, page, limit, search);

                if (fastResponse.success) {
                    const newAppsData = fastResponse.applications || [];
                    if (page === 1 && silent && newAppsData.length === 0 && applications.length > 0) {
                        console.log('[applicationStore] Silent refresh returned empty, preserving current data');
                        set({ isLoading: false });
                        return;
                    }

                    const newApps = newAppsData.map(transformApplication);

                    set((state) => {
                        let updatedApps;
                        if (page === 1) {
                            updatedApps = newApps;
                        } else {
                            updatedApps = [...state.applications, ...newApps];
                        }

                        return {
                            applications: updatedApps,
                            totalCount: fastResponse.applications?.length || state.totalCount,
                            hasMore: fastResponse.pagination?.has_more ?? false,
                            currentPage: page,
                            isLoading: false
                        };
                    });
                }
            }

            // Fetch full data for consistency (always runs)
            const fullResponse = await getApplications(false, page, limit, search);

            if (fullResponse.success && fullResponse.applications) {
                const fullApps = fullResponse.applications.map(transformApplication);
                set((state) => {
                    const currentMap = new Map(state.applications.map(a => [a.id, a]));
                    fullApps.forEach(app => currentMap.set(app.id, app));

                    return {
                        applications: Array.from(currentMap.values()).sort((a, b) => {
                            const idA = parseInt(a.id) || 0;
                            const idB = parseInt(b.id) || 0;
                            return idB - idA;
                        }),
                        isLoading: false
                    };
                });
            }
        } catch (err: any) {
            console.error('[applicationStore] Fetch failed:', err);
            set({ error: err.message || 'Failed to fetch applications', isLoading: false });
        }
    },

    refreshApplications: async () => {
        set({ applications: [], currentPage: 1, hasMore: true });
        await get().fetchApplications(1, 10000, '', false);
    },

    silentRefresh: async () => {
        await get().fetchApplications(1, 10000, '', true);
    }
}));

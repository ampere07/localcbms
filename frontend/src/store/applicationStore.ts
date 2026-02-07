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
        location: app.location || fullAddress,
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
            const fastResponse = await getApplications(true, page, limit, search);

            if (fastResponse.success) {
                const newApps = (fastResponse.applications || []).map(transformApplication);

                set((state) => ({
                    applications: page === 1 ? newApps : [...state.applications, ...newApps],
                    hasMore: fastResponse.pagination?.has_more ?? false,
                    currentPage: page,
                    isLoading: false
                }));

                const fullResponse = await getApplications(false, page, limit, search);

                if (fullResponse.success) {
                    const fullApps = (fullResponse.applications || []).map(transformApplication);
                    set((state) => ({
                        applications: page === 1
                            ? fullApps
                            : state.applications.map(app => fullApps.find(fa => fa.id === app.id) || app)
                    }));
                }
            }
        } catch (err: any) {
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

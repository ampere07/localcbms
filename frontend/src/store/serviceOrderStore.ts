import { create } from 'zustand';
import { getServiceOrders, ServiceOrderData } from '../services/serviceOrderService';

export interface ServiceOrder {
    id: string;
    ticketId: string;
    timestamp: string;
    accountNumber: string;
    fullName: string;
    contactAddress: string;
    dateInstalled: string;
    contactNumber: string;
    fullAddress: string;
    houseFrontPicture: string;
    emailAddress: string;
    plan: string;
    provider: string;
    affiliate: string;
    username: string;
    connectionType: string;
    routerModemSN: string;
    lcp: string;
    nap: string;
    port: string;
    vlan: string;
    concern: string;
    concernRemarks: string;
    visitStatus: string;
    visitBy: string;
    visitWith: string;
    visitWithOther: string;
    visitRemarks: string;
    modifiedBy: string;
    modifiedDate: string;
    userEmail: string;
    requestedBy: string;
    assignedEmail: string;
    supportRemarks: string;
    serviceCharge: string;
    repairCategory?: string;
    supportStatus?: string;
    priorityLevel?: string;
    newRouterSn?: string;
    newLcpnap?: string;
    newPlan?: string;
    clientSignatureUrl?: string;
    image1Url?: string;
    image2Url?: string;
    image3Url?: string;
    rawUpdatedAt?: string;
}

export const transformServiceOrder = (order: ServiceOrderData): ServiceOrder => {
    return {
        id: order.id || '',
        ticketId: order.ticket_id || order.id || '',
        timestamp: order.timestamp || '',
        accountNumber: order.account_no || '',
        fullName: order.full_name || '',
        contactAddress: order.contact_address || '',
        dateInstalled: order.date_installed || '',
        contactNumber: order.contact_number || '',
        fullAddress: order.full_address || '',
        houseFrontPicture: order.house_front_picture_url || '',
        emailAddress: order.email_address || '',
        plan: order.plan || '',
        provider: '',
        affiliate: order.group_name || '',
        username: order.username || '',
        connectionType: order.connection_type || '',
        routerModemSN: order.router_modem_sn || '',
        lcp: order.lcp || '',
        nap: order.nap || '',
        port: order.port || '',
        vlan: order.vlan || '',
        concern: order.concern || '',
        concernRemarks: order.concern_remarks || '',
        visitStatus: order.visit_status || '',
        visitBy: order.visit_by_user || '',
        visitWith: order.visit_with || '',
        visitWithOther: '',
        visitRemarks: order.visit_remarks || '',
        modifiedBy: order.updated_by_user || '',
        modifiedDate: order.updated_at || '',
        userEmail: order.assigned_email || '',
        requestedBy: order.requested_by || '',
        assignedEmail: order.assigned_email || '',
        supportRemarks: order.support_remarks || '',
        serviceCharge: order.service_charge ? String(order.service_charge) : '0',
        repairCategory: order.repair_category || '',
        supportStatus: order.support_status || '',
        priorityLevel: order.priority_level || '',
        newRouterSn: order.new_router_sn || '',
        newLcpnap: order.new_lcpnap || '',
        newPlan: order.new_plan || '',
        clientSignatureUrl: order.client_signature_url || '',
        image1Url: order.image1_url || '',
        image2Url: order.image2_url || '',
        image3Url: order.image3_url || '',
        rawUpdatedAt: order.updated_at || ''
    };
};

interface ServiceOrderState {
    serviceOrders: ServiceOrder[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    currentPage: number;
    totalCount: number;
    searchQuery: string;
    lastUpdated: Date | null;

    fetchServiceOrders: (force?: boolean, silent?: boolean) => Promise<void>;
    refreshServiceOrders: () => Promise<void>;
    silentRefresh: () => Promise<void>;
}

export const useServiceOrderStore = create<ServiceOrderState>((set, get) => ({
    serviceOrders: [],
    isLoading: false,
    error: null,
    hasMore: true,
    currentPage: 1,
    totalCount: 0,
    searchQuery: '',
    lastUpdated: null,

    fetchServiceOrders: async (force = false, silent = false) => {
        const { serviceOrders, isLoading, totalCount } = get();

        // Prevent re-fetching if we already have data and not forced
        if (!force && serviceOrders.length >= totalCount && totalCount > 0) {
            return;
        }

        if (isLoading && !force) return;

        const isInitialFetch = serviceOrders.length === 0;

        if (!silent && isInitialFetch) {
            set({ isLoading: true, error: null });
        }

        try {
            const authData = localStorage.getItem('authData');
            let assignedEmail: string | undefined;

            if (authData) {
                try {
                    const userData = JSON.parse(authData);
                    if (userData.role && userData.role.toLowerCase() === 'technician' && userData.email) {
                        assignedEmail = userData.email;
                    }
                } catch (err) { }
            }

            const CHUNK_SIZE = 2000;
            let allFetchedRecords = force ? [] : [...serviceOrders];
            let currentOffset = allFetchedRecords.length;
            let currentFetchPage = Math.floor(currentOffset / CHUNK_SIZE) + 1;

            console.log(`Fetching ServiceOrder records in chunks... Current offset: ${currentOffset}`);

            const firstResult = (await getServiceOrders(assignedEmail, currentFetchPage, CHUNK_SIZE, '')) as any;

            if (firstResult && firstResult.success && Array.isArray(firstResult.data)) {
                const dbTotal = firstResult.pagination?.total || firstResult.data.length;
                const newTransformed = firstResult.data.map(transformServiceOrder);
                allFetchedRecords = force ? newTransformed : [...allFetchedRecords, ...newTransformed];

                set({
                    serviceOrders: allFetchedRecords,
                    totalCount: dbTotal,
                    lastUpdated: new Date(),
                    error: null,
                    isLoading: false
                });

                let hasMore = firstResult.pagination?.has_more ?? (allFetchedRecords.length < dbTotal);
                currentFetchPage++;

                while (hasMore) {
                    try {
                        console.log(`Progressive ServiceOrder fetch: ${allFetchedRecords.length} / ${dbTotal}`);
                        const result = (await getServiceOrders(assignedEmail, currentFetchPage, CHUNK_SIZE, '')) as any;

                        if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
                            const chunkTransformed = result.data.map(transformServiceOrder);
                            allFetchedRecords = [...allFetchedRecords, ...chunkTransformed];

                            set({
                                serviceOrders: [...allFetchedRecords],
                                totalCount: result.pagination?.total || dbTotal
                            });

                            hasMore = result.pagination?.has_more ?? (allFetchedRecords.length < (result.pagination?.total || dbTotal));
                            currentFetchPage++;
                        } else {
                            hasMore = false;
                        }
                    } catch (chunkErr) {
                        console.error(`Error fetching ServiceOrder chunk:`, chunkErr);
                        hasMore = false;
                    }
                }
            } else {
                if (force || serviceOrders.length === 0) {
                    set({
                        serviceOrders: force ? [] : get().serviceOrders,
                        hasMore: false,
                        isLoading: false,
                        error: firstResult.message || 'Failed to fetch service orders'
                    });
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch service orders:', err);
            if (!silent || get().serviceOrders.length === 0) {
                set({
                    error: err.message || 'Failed to load service orders',
                    isLoading: false
                });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    refreshServiceOrders: async () => {
        await get().fetchServiceOrders(true, false);
    },

    silentRefresh: async () => {
        await get().fetchServiceOrders(true, true);
    }
}));

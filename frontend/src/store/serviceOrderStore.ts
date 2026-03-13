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
    newPlan?: string;
    clientSignatureUrl?: string;
    image1Url?: string;
    image2Url?: string;
    image3Url?: string;
    rawUpdatedAt?: string;
    referredBy?: string;
    status?: string;
    routerModel?: string;
    oldLcp?: string;
    oldNap?: string;
    oldPort?: string;
    oldVlan?: string;
    oldLcpnap?: string;
    newLcp?: string;
    newNap?: string;
    newPort?: string;
    newVlan?: string;
    newLcpnap?: string;
    billingDay?: string;
    onsiteRemarks?: string;
    statusRemarks?: string;
    contractTemplate?: string;
    ipAddress?: string;
    usageType?: string;
    start_time?: string | null;
    end_time?: string | null;
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
        lcp: order.lcp || order.old_lcp || '',
        nap: order.nap || order.old_nap || '',
        port: order.port || order.old_port || '',
        vlan: order.vlan || order.old_vlan || '',
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
        newPlan: order.new_plan || '',
        clientSignatureUrl: order.client_signature_url || '',
        image1Url: order.image1_url || '',
        image2Url: order.image2_url || '',
        image3Url: order.image3_url || '',
        rawUpdatedAt: order.updated_at || '',
        referredBy: (order as any).referred_by || '',
        status: (order as any).status || '',
        routerModel: (order as any).router_model || '',
        oldLcp: (order as any).old_lcp || '',
        oldNap: (order as any).old_nap || '',
        oldPort: (order as any).old_port || '',
        oldVlan: (order as any).old_vlan || '',
        oldLcpnap: (order as any).old_lcpnap || '',
        newLcp: (order as any).new_lcp || '',
        newNap: (order as any).new_nap || '',
        newPort: (order as any).new_port || '',
        newVlan: (order as any).new_vlan || '',
        newLcpnap: (order as any).new_lcpnap || '',
        billingDay: (order as any).billing_day || '',
        onsiteRemarks: (order as any).onsite_remarks || '',
        statusRemarks: (order as any).status_remarks || '',
        contractTemplate: (order as any).contract_template || '',
        ipAddress: (order as any).ip_address || '',
        usageType: (order as any).usage_type || '',
        start_time: order.start_time || null,
        end_time: order.end_time || null,
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
    fetchUpdates: () => Promise<void>;
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
    },

    fetchUpdates: async () => {
        const { serviceOrders, lastUpdated } = get();
        if (!lastUpdated) {
            await get().silentRefresh();
            return;
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

            // Format date for MySQL: YYYY-MM-DD HH:mm:ss
            const formattedDate = lastUpdated.toISOString().slice(0, 19).replace('T', ' ');
            
            console.log(`[ServiceOrderStore] Fetching updates since: ${formattedDate}`);
            const result = await getServiceOrders(assignedEmail, 1, 1000, '', formattedDate) as any;

            if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
                console.log(`[ServiceOrderStore] Received ${result.data.length} updates/new records`);
                const updatedTransformed = result.data.map(transformServiceOrder);
                
                // Merge updates into existing serviceOrders
                // We overwrite existing items with same ID and prepend/append new ones
                const mergedOrders = [...serviceOrders];
                
                updatedTransformed.forEach((newOrder: ServiceOrder) => {
                    const existingIndex = mergedOrders.findIndex(o => o.id === newOrder.id);
                    if (existingIndex !== -1) {
                        mergedOrders[existingIndex] = newOrder;
                    } else {
                        // Prepend new orders (assuming they are latest)
                        mergedOrders.unshift(newOrder);
                    }
                });

                set({ 
                    serviceOrders: mergedOrders,
                    lastUpdated: new Date(),
                    totalCount: result.pagination?.total || (get().totalCount + updatedTransformed.filter((n: ServiceOrder) => !serviceOrders.find(o => o.id === n.id)).length)
                });
            } else {
                set({ lastUpdated: new Date() });
            }
        } catch (err) {
            console.error('[ServiceOrderStore] Failed to fetch updates:', err);
        }
    }
}));

import { create } from 'zustand';
import { soaService, SOARecord } from '../services/soaService';

export interface SOARecordUI {
    id: string;
    accountNo: string;
    statementDate: string;
    balanceFromPreviousBill: number;
    paymentReceivedPrevious: number;
    remainingBalancePrevious: number;
    monthlyServiceFee: number;
    serviceCharge: number;
    rebate: number;
    discounts: number;
    staggered: number;
    vat: number;
    dueDate: string;
    amountDue: number;
    totalAmountDue: number;
    printLink?: string;
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
    fullName: string;
    contactNumber: string;
    emailAddress: string;
    address: string;
    plan: string;
    dateInstalled: string;
    barangay?: string;
    city?: string;
    region?: string;
    provider?: string;
    statementNo?: string;
    paymentReceived?: number;
    remainingBalance?: number;
    deliveryStatus?: string;
    deliveryDate?: string;
    deliveredBy?: string;
    deliveryRemarks?: string;
    deliveryProof?: string;
    modifiedBy?: string;
    modifiedDate?: string;
}

interface SOAState {
    soaRecords: SOARecordUI[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    fetchSOARecords: (force?: boolean, silent?: boolean) => Promise<void>;
    silentRefresh: () => Promise<void>;
    refreshSOARecords: () => Promise<void>;
}

const transform = (record: SOARecord): SOARecordUI => ({
    id: record.id.toString(),
    accountNo: record.account_no || record.account?.account_no || '',
    statementDate: record.statement_date ? new Date(record.statement_date).toLocaleDateString() : 'N/A',
    balanceFromPreviousBill: Number(record.balance_from_previous_bill) || 0,
    paymentReceivedPrevious: Number(record.payment_received_previous) || 0,
    remainingBalancePrevious: Number(record.remaining_balance_previous) || 0,
    monthlyServiceFee: Number(record.monthly_service_fee) || 0,
    serviceCharge: Number(record.service_charge) || 0,
    rebate: Number(record.rebate) || 0,
    discounts: Number(record.discounts) || 0,
    staggered: Number(record.staggered) || 0,
    vat: Number(record.vat) || 0,
    dueDate: record.due_date ? new Date(record.due_date).toLocaleDateString() : 'N/A',
    amountDue: Number(record.amount_due) || 0,
    totalAmountDue: Number(record.total_amount_due) || 0,
    printLink: record.print_link,
    createdAt: record.created_at ? new Date(record.created_at).toLocaleString() : '',
    createdBy: record.created_by,
    updatedAt: record.updated_at ? new Date(record.updated_at).toLocaleString() : '',
    updatedBy: record.updated_by,
    fullName: record.account?.customer?.full_name || 'Unknown',
    contactNumber: record.account?.customer?.contact_number_primary || 'N/A',
    emailAddress: record.account?.customer?.email_address || 'N/A',
    address: record.account?.customer?.address || 'N/A',
    plan: record.account?.customer?.desired_plan || 'No Plan',
    dateInstalled: record.account?.date_installed ? new Date(record.account.date_installed).toLocaleDateString() : 'N/A',
    barangay: record.account?.customer?.barangay || '',
    city: record.account?.customer?.city || '',
    region: record.account?.customer?.region || '',
    provider: 'SWITCH',
    statementNo: '2509180' + record.id.toString(),
    paymentReceived: Number(record.payment_received_previous) || 0,
    remainingBalance: Number(record.remaining_balance_previous) || 0,
    modifiedBy: record.updated_by,
    modifiedDate: record.updated_at ? new Date(record.updated_at).toLocaleDateString() : undefined,
});

export const useSOAStore = create<SOAState>((set, get) => ({
    soaRecords: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    lastUpdated: null,

    fetchSOARecords: async (force = false, silent = false) => {
        const { soaRecords, isLoading, totalCount } = get();

        // Prevent re-fetching if we already have data and not forced
        if (!force && soaRecords.length >= totalCount && totalCount > 0) {
            return;
        }

        if (isLoading && !force) return;

        const isInitialFetch = soaRecords.length === 0;

        if (!silent && isInitialFetch) {
            set({ isLoading: true });
        }

        try {
            const CHUNK_SIZE = 2000;
            let allFetchedRecords = force ? [] : [...soaRecords];
            let currentOffset = allFetchedRecords.length;
            let currentFetchPage = Math.floor(currentOffset / CHUNK_SIZE) + 1;

            console.log(`Fetching SOA records in chunks... Current offset: ${currentOffset}`);

            // Fetch first/next chunk
            const firstResult = await soaService.getAllStatementsWithTotal(false, currentFetchPage, CHUNK_SIZE);

            if (firstResult && firstResult.data) {
                const dbTotal = firstResult.total || firstResult.data.length;
                const newTransformed = firstResult.data.map(transform);
                allFetchedRecords = force ? newTransformed : [...allFetchedRecords, ...newTransformed];

                set({
                    soaRecords: allFetchedRecords,
                    totalCount: dbTotal,
                    lastUpdated: new Date(),
                    error: null,
                    isLoading: false
                });

                // Progressive background loading
                let hasMore = allFetchedRecords.length < dbTotal;
                currentFetchPage++;

                while (hasMore) {
                    try {
                        console.log(`Progressive SOA fetch: ${allFetchedRecords.length} / ${dbTotal}`);
                        const result = await soaService.getAllStatementsWithTotal(false, currentFetchPage, CHUNK_SIZE);

                        if (result && result.data && result.data.length > 0) {
                            const chunkTransformed = result.data.map(transform);
                            allFetchedRecords = [...allFetchedRecords, ...chunkTransformed];
                            set({
                                soaRecords: [...allFetchedRecords],
                                totalCount: result.total || dbTotal
                            });

                            hasMore = result.pagination?.has_more || allFetchedRecords.length < dbTotal;
                            currentFetchPage++;
                        } else {
                            hasMore = false;
                        }
                    } catch (chunkErr) {
                        console.error(`Error fetching SOA chunk:`, chunkErr);
                        hasMore = false;
                    }
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch SOA records:', err);
            if (!silent && get().soaRecords.length === 0) {
                set({ error: 'Failed to load SOA records. Please try again.' });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    refreshSOARecords: async () => {
        await get().fetchSOARecords(true, false);
    },

    silentRefresh: async () => {
        await get().fetchSOARecords(true, true);
    }
}));

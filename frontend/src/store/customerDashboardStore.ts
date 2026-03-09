import { create } from 'zustand';
import { getCustomerDetail, CustomerDetailData } from '../services/customerDetailService';
import { soaService } from '../services/soaService';
import { invoiceService } from '../services/invoiceService';
import { paymentPortalLogsService } from '../services/paymentPortalLogsService';
import { transactionService } from '../services/transactionService';

interface Payment {
    id: string;
    date: string;
    reference: string;
    amount: number;
    source: string;
    status: string;
}

interface CustomerDashboardState {
    customerDetail: CustomerDetailData | null;
    soaRecords: any[];
    invoiceRecords: any[];
    paymentRecords: Payment[];
    isLoading: boolean;
    error: string | null;
    fetchedAccountNo: string | null;

    fetchCustomerData: (usernameOrAccountNo: string, isCustomerRole?: boolean) => Promise<void>;
    refreshCustomerData: () => Promise<void>;
}

export const useCustomerDashboardStore = create<CustomerDashboardState>((set, get) => ({
    customerDetail: null,
    soaRecords: [],
    invoiceRecords: [],
    paymentRecords: [],
    isLoading: false,
    error: null,
    fetchedAccountNo: null,

    fetchCustomerData: async (usernameOrAccountNo: string, isCustomerRole = true) => {
        const { fetchedAccountNo, isLoading } = get();

        // Prevent refetching for the same user if already loaded
        if (fetchedAccountNo === usernameOrAccountNo || isLoading) return;

        set({ isLoading: true, error: null });

        try {
            const detail = await getCustomerDetail(usernameOrAccountNo);

            if (detail && detail.billingAccount) {
                const accNo = detail.billingAccount.accountNo;
                const billingId = detail.billingAccount.id;

                const [soaRes, invoiceRes, logsRes, txRes] = await Promise.all([
                    (isCustomerRole ? soaService.getStatementsByAccountNo(accNo) : soaService.getStatementsByAccount(billingId)).catch(() => []),
                    (isCustomerRole ? invoiceService.getInvoicesByAccountNo(accNo) : invoiceService.getInvoicesByAccount(billingId)).catch(() => []),
                    paymentPortalLogsService.getLogsByAccountNo(accNo).catch(() => []),
                    transactionService.getTransactionsByAccountNo(accNo).catch(() => ({ success: false, data: [] }))
                ]);

                // Process Payments
                const formattedLogs: Payment[] = Array.isArray(logsRes) ? logsRes.map((l: any) => ({
                    id: `log-${l.id}`,
                    date: l.date_time,
                    reference: l.reference_no,
                    amount: parseFloat(l.total_amount),
                    source: 'Online',
                    status: l.status || 'Success'
                })) : [];

                let formattedTxs: Payment[] = [];
                if (txRes && txRes.success && Array.isArray(txRes.data)) {
                    formattedTxs = txRes.data
                        .map((t: any) => ({
                            id: `tx-${t.id}`,
                            date: t.payment_date || t.created_at,
                            reference: t.or_no || t.reference_no || `TR-${t.id}`,
                            amount: parseFloat(t.received_payment || t.amount || 0),
                            source: 'Manual',
                            status: 'Computed'
                        }));
                }

                const allPayments = [...formattedLogs, ...formattedTxs].sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                set({
                    customerDetail: detail,
                    soaRecords: soaRes || [],
                    invoiceRecords: invoiceRes || [],
                    paymentRecords: allPayments,
                    fetchedAccountNo: usernameOrAccountNo,
                    isLoading: false
                });
            } else {
                set({ error: 'Customer billing details not found', isLoading: false });
            }
        } catch (err: any) {
            console.error('Failed to fetch customer dashboard data:', err);
            set({ error: err.message || 'Error loading dashboard data', isLoading: false });
        }
    },

    refreshCustomerData: async () => {
        const { fetchedAccountNo } = get();
        if (fetchedAccountNo) {
            set({ fetchedAccountNo: null }); // Clear cached ID to force refresh
            await get().fetchCustomerData(fetchedAccountNo);
        }
    }
}));

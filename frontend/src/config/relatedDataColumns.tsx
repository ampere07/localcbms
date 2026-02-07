export interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export const relatedDataColumns = {
  invoices: [
    { key: 'id', label: 'Invoice ID', render: (val: any, row: any) => row.id || row.invoice_id },
    { key: 'amount', label: 'Amount', render: (val: any, row: any) => `₱${row.amount || row.total_amount || '0.00'}` },
    { key: 'status', label: 'Status' },
    {
      key: 'invoice_date',
      label: 'Date',
      render: (val: any, row: any) => {
        const dateStr = row.invoice_date || row.created_at || row.date;
        if (!dateStr) return 'N/A';
        return dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
      }
    }
  ] as TableColumn[],

  paymentPortalLogs: [
    { key: 'id', label: 'ID' },
    { key: 'total_amount', label: 'Amount', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'status', label: 'Status' },
    {
      key: 'date_time',
      label: 'Date',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    }
  ] as TableColumn[],

  transactions: [
    { key: 'id', label: 'Transaction ID', render: (val: any, row: any) => row.id || row.transaction_id || 'N/A' },
    { key: 'received_payment', label: 'Amount', render: (val: any, row: any) => `₱${parseFloat(row.received_payment || '0').toFixed(2)}` },
    { key: 'transaction_type', label: 'Type' },
    { key: 'payment_method', label: 'Payment Method', render: (val: any) => val || 'N/A' },
    {
      key: 'date_processed',
      label: 'Date',
      render: (val: any, row: any) => {
        const dateStr = row.date_processed || row.payment_date || row.created_at || row.date;
        if (!dateStr) return 'N/A';
        return dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
      }
    }
  ] as TableColumn[],

  staggered: [
    { key: 'id', label: 'ID' },
    {
      key: 'staggered_date',
      label: 'Date',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    },
    { key: 'staggered_balance', label: 'Balance', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'monthly_payment', label: 'Monthly', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    {
      key: 'modified_date',
      label: 'Modified',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    }
  ] as TableColumn[],

  discounts: [
    { key: 'id', label: 'ID' },
    { key: 'discount_amount', label: 'Amount', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'status', label: 'Status' },
    {
      key: 'used_date',
      label: 'Used Date',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    }
  ] as TableColumn[],

  serviceOrders: [
    { key: 'id', label: 'SO ID' },
    { key: 'concern', label: 'Type', render: (val: any) => val || 'N/A' },
    { key: 'support_status', label: 'Status', render: (val: any) => val || 'N/A' },
    { key: 'assigned_email', label: 'Assigned To', render: (val: any) => val || 'Unassigned' },
    {
      key: 'timestamp',
      label: 'Date',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    }
  ] as TableColumn[],

  reconnectionLogs: [
    { key: 'id', label: 'Log ID' },
    { key: 'plan_name', label: 'Plan', render: (val: any) => val || 'N/A' },
    { key: 'reconnection_fee', label: 'Fee', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    {
      key: 'created_at',
      label: 'Date',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    }
  ] as TableColumn[],

  disconnectedLogs: [
    { key: 'id', label: 'Log ID' },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || 'N/A' },
    {
      key: 'created_at',
      label: 'Date',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    }
  ] as TableColumn[],

  detailsUpdateLogs: [
    { key: 'id', label: 'Log ID' },
    { key: 'old_details', label: 'Old Details', render: (val: any) => val || 'N/A' },
    { key: 'new_details', label: 'New Details', render: (val: any) => val || 'N/A' },
    { key: 'updated_by_user_id', label: 'Updated By', render: (val: any) => val || 'System' },
    {
      key: 'updated_at',
      label: 'Date',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    }
  ] as TableColumn[],

  planChangeLogs: [
    { key: 'id', label: 'Log ID' },
    { key: 'old_plan_name', label: 'Old Plan', render: (val: any) => val || '-' },
    { key: 'new_plan_name', label: 'New Plan', render: (val: any) => val || '-' },
    { key: 'status', label: 'Status' },
    {
      key: 'date_changed',
      label: 'Date Changed',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    },
    {
      key: 'date_used',
      label: 'Date Used',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    }
  ] as TableColumn[],

  serviceChargeLogs: [
    { key: 'id', label: 'Log ID' },
    { key: 'service_charge', label: 'Service Charge', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'status', label: 'Status' },
    {
      key: 'date_used',
      label: 'Date Used',
      render: (val: any) => {
        if (!val) return 'N/A';
        return val.includes(' ') ? val.split(' ')[0] : val;
      }
    }
  ] as TableColumn[],

  changeDueLogs: [
    { key: 'id', label: 'Log ID' },
    {
      key: 'previous_date',
      label: 'Previous Date',
      render: (val: any) => val ? (val.includes(' ') ? val.split(' ')[0] : val) : 'N/A'
    },
    {
      key: 'changed_date',
      label: 'Changed Date',
      render: (val: any) => val ? (val.includes(' ') ? val.split(' ')[0] : val) : 'N/A'
    },
    { key: 'added_balance', label: 'Added Balance', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || 'N/A' },
    {
      key: 'created_at',
      label: 'Date',
      render: (val: any) => val ? (val.includes(' ') ? val.split(' ')[0] : val) : 'N/A'
    }
  ] as TableColumn[],

  securityDeposits: [
    { key: 'id', label: 'ID' },
    { key: 'amount', label: 'Amount', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'status', label: 'Status' },
    {
      key: 'payment_date',
      label: 'Payment Date',
      render: (val: any) => val ? (val.includes(' ') ? val.split(' ')[0] : val) : 'N/A'
    },
    { key: 'reference_no', label: 'Ref No', render: (val: any) => val || 'N/A' },
    { key: 'created_by', label: 'Created By', render: (val: any) => val || 'N/A' },
    {
      key: 'created_at',
      label: 'Date',
      render: (val: any) => val ? (val.includes(' ') ? val.split(' ')[0] : val) : 'N/A'
    }
  ] as TableColumn[],

  statementOfAccounts: [
    { key: 'id', label: 'ID' },
    {
      key: 'statement_date',
      label: 'Date',
      render: (val: any) => val ? (val.includes(' ') ? val.split(' ')[0] : val) : 'N/A'
    },
    {
      key: 'balance_from_previous_bill',
      label: 'Balance Prev',
      render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}`
    },
    {
      key: 'payment_received_previous',
      label: 'Payment Prev',
      render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}`
    },
    {
      key: 'remaining_balance_previous',
      label: 'Rem. Balance',
      render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}`
    },
    {
      key: 'amount_due',
      label: 'Amount Due',
      render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}`
    },
    {
      key: 'total_amount_due',
      label: 'Total Due',
      render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}`
    }
  ] as TableColumn[]
};

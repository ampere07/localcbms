import React from 'react';

export interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

const formatDate = (val: any) => {
  if (!val) return '-';
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch (e) {
    return val;
  }
};

export const relatedDataColumns = {
  invoices: [
    { key: 'status', label: 'Invoice Status', render: (val: any) => val || '-' },
    {
      key: 'invoice_date',
      label: 'Invoice Date',
      render: (val: any) => formatDate(val)
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'total_amount', label: 'Total Amount', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'received_payment', label: 'Received Payment', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'account_no', label: 'Account No' },
    { key: 'invoice_no', label: 'Invoice No', render: (val: any) => val || '-' },
    { key: 'full_name', label: 'Full Name', render: (val: any) => val || '-' },
    { key: 'contact_number', label: 'Contact Number', render: (val: any) => val || '-' },
    { key: 'email_address', label: 'Email Address', render: (val: any) => val || '-' },
    { key: 'address', label: 'Address', render: (val: any) => val || '-' },
    { key: 'plan', label: 'Plan', render: (val: any) => val || '-' },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'invoice_balance', label: 'Invoice Balance', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'staggered', label: 'Staggered', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'service_charge', label: 'Service Charge', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'discounts', label: 'Discounts', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'rebate', label: 'Rebates', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    {
      key: 'date_processed',
      label: 'Date Processed',
      render: (val: any) => formatDate(val)
    },
    { key: 'processed_by', label: 'Processed By', render: (val: any) => val || '-' },
    { key: 'payment_method', label: 'Payment Method', render: (val: any) => val || '-' },
    { key: 'reference_no', label: 'Reference No', render: (val: any) => val || '-' },
    { key: 'or_no', label: 'OR No', render: (val: any) => val || '-' },
    { key: 'updated_by', label: 'Modified By', render: (val: any) => val || '-' },
    {
      key: 'updated_at',
      label: 'Modified Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'transaction_id', label: 'Transaction ID', render: (val: any) => val || '-' },
    { key: 'barangay', label: 'Barangay', render: (val: any) => val || '-' },
    { key: 'city', label: 'City', render: (val: any) => val || '-' }
  ] as TableColumn[],

  paymentPortalLogs: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    {
      key: 'date_time',
      label: 'Date Time',
      render: (val: any) => formatDate(val)
    },
    { key: 'reference_no', label: 'Reference No', render: (val: any) => val || '-' },
    { key: 'total_amount', label: 'Total Amount', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'transaction_status', label: 'Transaction Status', render: (val: any) => val || '-' },
    { key: 'account_no', label: 'Account No', render: (val: any) => val || '-' },
    { key: 'contact_no', label: 'Contact No', render: (val: any) => val || '-' },
    { key: 'account_balance', label: 'Account Balance', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'checkout_id', label: 'Checkout ID', render: (val: any) => val || '-' },
    { key: 'plan', label: 'Plan', render: (val: any) => val || '-' },
    { key: 'ewallet_type', label: 'Ewallet Type', render: (val: any) => val || '-' },
    { key: 'payment_method', label: 'Payment Method', render: (val: any) => val || '-' },
    { key: 'payment_channel', label: 'Payment Channel', render: (val: any) => val || '-' },
    { key: 'name', label: 'Name', render: (val: any) => val || '-' },
    { key: 'barangay', label: 'Barangay', render: (val: any) => val || '-' },
    { key: 'city', label: 'City', render: (val: any) => val || '-' }
  ] as TableColumn[],

  transactions: [
    {
      key: 'date_processed',
      label: 'Date Processed',
      render: (val: any) => formatDate(val)
    },
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    { key: 'received_payment', label: 'Received Payment', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'or_no', label: 'OR No', render: (val: any) => val || '-' },
    { key: 'processed_by_user', label: 'Processed By', render: (val: any) => val || '-' },
    { key: 'reference_no', label: 'Reference No', render: (val: any) => val || '-' },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'id', label: 'Transaction ID' },
    { key: 'account_no', label: 'Account No', render: (val: any) => val || '-' },
    { key: 'full_name', label: 'Full Name', render: (val: any) => val || '-' },
    { key: 'contact_no', label: 'Contact No', render: (val: any) => val || '-' },
    { key: 'payment_method', label: 'Payment Method', render: (val: any) => val || '-' },
    { key: 'updated_by_user', label: 'Modified By', render: (val: any) => val || '-' },
    {
      key: 'updated_at',
      label: 'Modified Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'transaction_type', label: 'Transaction Type', render: (val: any) => val || '-' },
    {
      key: 'payment_date',
      label: 'Payment Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'barangay', label: 'Barangay', render: (val: any) => val || '-' },
    { key: 'city', label: 'City', render: (val: any) => val || '-' },
    { key: 'account_balance_before', label: 'Account Balance', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` }
  ] as TableColumn[],

  staggered: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    { key: 'id', label: 'ID' },
    { key: 'account_no', label: 'Account No', render: (val: any) => val || '-' },
    { key: 'staggered_install_no', label: 'Install No', render: (val: any) => val || '-' },
    {
      key: 'staggered_date',
      label: 'Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'staggered_balance', label: 'Balance', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'months_to_pay', label: 'Months', render: (val: any) => val || 0 },
    { key: 'monthly_payment', label: 'Monthly', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'modified_by', label: 'Modified By', render: (val: any) => val || '-' },
    {
      key: 'modified_date',
      label: 'Modified Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'user_email', label: 'User Email', render: (val: any) => val || '-' },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' }
  ] as TableColumn[],

  discounts: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    { key: 'id', label: 'ID' },
    { key: 'account_no', label: 'Account No', render: (val: any) => val || '-' },
    { key: 'invoice_used_id', label: 'Invoice ID', render: (val: any) => val || '-' },
    { key: 'discount_amount', label: 'Discount', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'remaining', label: 'Remaining', render: (val: any) => val || 0 },
    {
      key: 'used_date',
      label: 'Used Date',
      render: (val: any) => formatDate(val)
    },
    {
      key: 'processed_date',
      label: 'Processed',
      render: (val: any) => formatDate(val)
    },
    { key: 'processed_by_user_id', label: 'Processed By', render: (val: any) => val || '-' },
    { key: 'approved_by_user_id', label: 'Approved By', render: (val: any) => val || '-' },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'created_at', label: 'Created At', render: (val: any) => formatDate(val) },
    { key: 'created_by_user_id', label: 'Created By', render: (val: any) => val || '-' },
    { key: 'updated_at', label: 'Updated At', render: (val: any) => formatDate(val) },
    { key: 'updated_by_user_id', label: 'Updated By', render: (val: any) => val || '-' }
  ] as TableColumn[],

  serviceOrders: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    { key: 'id', label: 'ID' },
    { key: 'account_no', label: 'Account No', render: (val: any) => val || '-' },
    { key: 'invoice_id', label: 'Invoice ID', render: (val: any) => val || '-' },
    { key: 'ticket_id', label: 'Ticket ID', render: (val: any) => val || '-' },
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (val: any) => formatDate(val)
    },
    { key: 'support_status', label: 'Support Status', render: (val: any) => val || '-' },
    { key: 'concern', label: 'Concern', render: (val: any) => val || '-' },
    { key: 'concern_remarks', label: 'Concern Remarks', render: (val: any) => val || '-' },
    { key: 'priority_level', label: 'Priority', render: (val: any) => val || '-' },
    { key: 'requested_by', label: 'Requested By', render: (val: any) => val || '-' },
    { key: 'assigned_email', label: 'Assigned To', render: (val: any) => val || '-' },
    { key: 'visit_status', label: 'Visit Status', render: (val: any) => val || '-' },
    { key: 'visit_by_user', label: 'Visit By', render: (val: any) => val || '-' },
    { key: 'visit_with', label: 'Visit With', render: (val: any) => val || '-' },
    { key: 'visit_with_other', label: 'Visit With Other', render: (val: any) => val || '-' },
    { key: 'visit_remarks', label: 'Visit Remarks', render: (val: any) => val || '-' },
    { key: 'repair_category', label: 'Repair Cat', render: (val: any) => val || '-' },
    { key: 'support_remarks', label: 'Support Remarks', render: (val: any) => val || '-' },
    { key: 'service_charge', label: 'Svc Charge', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'client_signature_url', label: 'Signature', render: (val: any) => val ? 'View' : '-' },
    { key: 'image1_url', label: 'Img 1', render: (val: any) => val ? 'View' : '-' },
    { key: 'image2_url', label: 'Img 2', render: (val: any) => val ? 'View' : '-' },
    { key: 'image3_url', label: 'Img 3', render: (val: any) => val ? 'View' : '-' },
    { key: 'created_at', label: 'Created At', render: (val: any) => formatDate(val) },
    { key: 'created_by_user', label: 'Created By', render: (val: any) => val || '-' },
    { key: 'updated_at', label: 'Updated At', render: (val: any) => formatDate(val) },
    { key: 'updated_by_user', label: 'Updated By', render: (val: any) => val || '-' },
    { key: 'old_lcp', label: 'Old LCP', render: (val: any) => val || '-' },
    { key: 'old_nap', label: 'Old NAP', render: (val: any) => val || '-' },
    { key: 'old_port', label: 'Old Port', render: (val: any) => val || '-' },
    { key: 'old_router_modem_sn', label: 'Old SN', render: (val: any) => val || '-' },
    { key: 'old_vlan', label: 'Old VLAN', render: (val: any) => val || '-' },
    { key: 'new_router_modem_sn', label: 'New SN', render: (val: any) => val || '-' },
    { key: 'new_lcp', label: 'New LCP', render: (val: any) => val || '-' },
    { key: 'new_nap', label: 'New NAP', render: (val: any) => val || '-' },
    { key: 'new_port', label: 'New Port', render: (val: any) => val || '-' },
    { key: 'new_vlan', label: 'New VLAN', render: (val: any) => val || '-' },
    { key: 'router_model', label: 'Router Model', render: (val: any) => val || '-' },
    { key: 'new_lcpnap', label: 'New LCPNAP', render: (val: any) => val || '-' },
    { key: 'old_lcpnap', label: 'Old LCPNAP', render: (val: any) => val || '-' },
    { key: 'old_plan', label: 'Old Plan', render: (val: any) => val || '-' },
    { key: 'new_plan', label: 'New Plan', render: (val: any) => val || '-' },
    { key: 'referred_by', label: 'Referred By', render: (val: any) => val || '-' }
  ] as TableColumn[],

  reconnectionLogs: [
    { key: 'id', label: 'ID' },
    { key: 'account_id', label: 'Account ID', render: (val: any) => val || '-' },
    { key: 'session_id', label: 'Session ID', render: (val: any) => val || '-' },
    { key: 'username', label: 'Username', render: (val: any) => val || '-' },
    { key: 'plan_id', label: 'Plan ID', render: (val: any) => val || '-' },
    { key: 'reconnection_fee', label: 'Fee', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'created_at', label: 'Created At', render: (val: any) => formatDate(val) },
    { key: 'created_by_user', label: 'Created By', render: (val: any) => val || '-' },
    { key: 'updated_at', label: 'Updated At', render: (val: any) => formatDate(val) },
    { key: 'updated_by_user', label: 'Updated By', render: (val: any) => val || '-' }
  ] as TableColumn[],

  disconnectedLogs: [
    { key: 'id', label: 'ID' },
    { key: 'account_id', label: 'Account ID', render: (val: any) => val || '-' },
    { key: 'session_id', label: 'Session ID', render: (val: any) => val || '-' },
    { key: 'username', label: 'Username', render: (val: any) => val || '-' },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'created_at', label: 'Created At', render: (val: any) => formatDate(val) },
    { key: 'created_by_user', label: 'Created By', render: (val: any) => val || '-' },
    { key: 'updated_at', label: 'Updated At', render: (val: any) => formatDate(val) },
    { key: 'updated_by_user', label: 'Updated By', render: (val: any) => val || '-' }
  ] as TableColumn[],

  detailsUpdateLogs: [
    { key: 'id', label: 'ID' },
    { key: 'account_id', label: 'Account ID', render: (val: any) => val || '-' },
    { key: 'old_details', label: 'Old Details', render: (val: any) => val || '-' },
    { key: 'new_details', label: 'New Details', render: (val: any) => val || '-' },
    { key: 'created_at', label: 'Created At', render: (val: any) => formatDate(val) },
    { key: 'created_by_user_id', label: 'Created By', render: (val: any) => val || '-' },
    { key: 'updated_at', label: 'Updated At', render: (val: any) => formatDate(val) },
    { key: 'updated_by_user_id', label: 'Updated By', render: (val: any) => val || '-' }
  ] as TableColumn[],

  planChangeLogs: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    { key: 'id', label: 'ID' },
    { key: 'account_id', label: 'Account ID', render: (val: any) => val || '-' },
    { key: 'old_plan_id', label: 'Old Plan ID', render: (val: any) => val || '-' },
    { key: 'new_plan_id', label: 'New Plan ID', render: (val: any) => val || '-' },
    {
      key: 'date_changed',
      label: 'Date Changed',
      render: (val: any) => formatDate(val)
    },
    {
      key: 'date_used',
      label: 'Date Used',
      render: (val: any) => formatDate(val)
    },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'created_at', label: 'Created At', render: (val: any) => formatDate(val) },
    { key: 'created_by_user', label: 'Created By', render: (val: any) => val || '-' },
    { key: 'updated_at', label: 'Updated At', render: (val: any) => formatDate(val) },
    { key: 'updated_by_user', label: 'Updated By', render: (val: any) => val || '-' }
  ] as TableColumn[],

  serviceChargeLogs: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    { key: 'id', label: 'ID' },
    { key: 'account_no', label: 'Account No', render: (val: any) => val || '-' },
    { key: 'service_order_id', label: 'SO ID', render: (val: any) => val || '-' },
    { key: 'service_charge', label: 'Svc Charge', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    {
      key: 'date_used',
      label: 'Date Used',
      render: (val: any) => formatDate(val)
    },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'created_at', label: 'Created At', render: (val: any) => formatDate(val) },
    { key: 'created_by', label: 'Created By', render: (val: any) => val || '-' },
    { key: 'updated_at', label: 'Updated At', render: (val: any) => formatDate(val) },
    { key: 'updated_by', label: 'Updated By', render: (val: any) => val || '-' },
    { key: 'invoice_id', label: 'Invoice ID', render: (val: any) => val || '-' },
    { key: 'service_charge_type', label: 'Charge Type', render: (val: any) => val || '-' }
  ] as TableColumn[],

  changeDueLogs: [
    { key: 'id', label: 'ID' },
    { key: 'account_id', label: 'Account ID', render: (val: any) => val || '-' },
    { key: 'previous_date', label: 'Prev Date', render: (val: any) => formatDate(val) },
    { key: 'changed_date', label: 'Changed Date', render: (val: any) => formatDate(val) },
    { key: 'added_balance', label: 'Added Bal', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'created_at', label: 'Created At', render: (val: any) => formatDate(val) },
    { key: 'created_by_user_id', label: 'Created By', render: (val: any) => val || '-' },
    { key: 'updated_at', label: 'Updated At', render: (val: any) => formatDate(val) },
    { key: 'updated_by_user_id', label: 'Updated By', render: (val: any) => val || '-' }
  ] as TableColumn[],

  securityDeposits: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    { key: 'id', label: 'ID' },
    { key: 'account_id', label: 'Account ID', render: (val: any) => val || '-' },
    { key: 'amount', label: 'Amount', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    {
      key: 'payment_date',
      label: 'Payment Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'reference_no', label: 'Ref No', render: (val: any) => val || '-' },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'created_by', label: 'Created By', render: (val: any) => val || '-' },
    { key: 'created_at', label: 'Created At', render: (val: any) => formatDate(val) },
    { key: 'updated_at', label: 'Updated At', render: (val: any) => formatDate(val) }
  ] as TableColumn[],

  statementOfAccounts: [
    {
      key: 'statement_date',
      label: 'Statement Date',
      render: (val: any) => formatDate(val)
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'balance_from_previous_bill', label: 'Balance From Previous Bill', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'amount_due', label: 'Amount Due', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'total_amount_due', label: 'Total Amount Due', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'statement_no', label: 'Statement No', render: (val: any) => val || '-' },
    { key: 'full_name', label: 'Full Name', render: (val: any) => val || '-' },
    { key: 'account_no', label: 'Account No', render: (val: any) => val || '-' },
    {
      key: 'date_installed',
      label: 'Date Installed',
      render: (val: any) => formatDate(val)
    },
    { key: 'email_address', label: 'Email Address', render: (val: any) => val || '-' },
    { key: 'plan', label: 'Plan', render: (val: any) => val || '-' },
    { key: 'payment_received_previous', label: 'Payment Received From Previous Bill', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'remaining_balance_previous', label: 'Remaining Balance From Previous Bill', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'monthly_service_fee', label: 'Monthly Service Fee', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'vat', label: 'VAT', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'address', label: 'Address', render: (val: any) => val || '-' },
    { key: 'staggered', label: 'Staggered', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'service_charge', label: 'Service Charge', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'discounts', label: 'Discounts', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    { key: 'rebate', label: 'Rebates', render: (val: any) => `₱${parseFloat(val || '0').toFixed(2)}` },
    {
      key: 'disconnection_date',
      label: 'Disconnection Date',
      render: (val: any) => formatDate(val)
    },
    {
      key: 'updated_at',
      label: 'Modified Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'print_link', label: 'Print Link', render: (val: any) => val ? 'View' : '-' },
    { key: 'barangay', label: 'Barangay', render: (val: any) => val || '-' },
    { key: 'city', label: 'City', render: (val: any) => val || '-' },
    { key: 'region', label: 'Region', render: (val: any) => val || '-' }
  ] as TableColumn[],

  inventoryLogs: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    {
      key: 'date',
      label: 'Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'item_name', label: 'Item', render: (val: any) => val || '-' },
    { key: 'item_description', label: 'Description', render: (val: any) => val || '-' },
    { key: 'log_type', label: 'Type', render: (val: any) => val || '-' },
    { key: 'item_quantity', label: 'Qty', render: (val: any) => val || 0 },
    { key: 'sn', label: 'Serial No', render: (val: any) => val || '-' },
    { key: 'requested_by', label: 'Requested By', render: (val: any) => val || '-' },
    { key: 'requested_with', label: 'Requested With', render: (val: any) => val || '-' },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'user_email', label: 'User Email', render: (val: any) => val || '-' }
  ] as TableColumn[],

  borrowedLogs: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    {
      key: 'date',
      label: 'Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'borrowed_by', label: 'Borrowed By', render: (val: any) => val || '-' },
    { key: 'item_quantity', label: 'Quantity', render: (val: any) => val || 0 },
  ] as TableColumn[],

  jobOrders: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    { key: 'job_order_no', label: 'JO No.', render: (val: any) => val || '-' },
    { key: 'customer_name', label: 'Customer', render: (val: any) => val || '-' },
    { key: 'item_quantity', label: 'Quantity', render: (val: any) => val || 0 },
    {
      key: 'created_at',
      label: 'Date',
      render: (val: any) => formatDate(val)
    }
  ] as TableColumn[],

  defectiveLogs: [
    { key: 'status', label: 'Status', render: (val: any) => val || '-' },
    {
      key: 'date',
      label: 'Date',
      render: (val: any) => formatDate(val)
    },
    { key: 'reported_by', label: 'Reported By', render: (val: any) => val || '-' },
    { key: 'item_quantity', label: 'Qty', render: (val: any) => val || 0 },
    { key: 'defect_type', label: 'Type', render: (val: any) => val || '-' },
    { key: 'remarks', label: 'Remarks', render: (val: any) => val || '-' },
    { key: 'sn', label: 'Serial No', render: (val: any) => val || '-' }
  ] as TableColumn[],
};

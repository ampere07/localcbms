import React from 'react';
import { Trash2, Edit, ChevronLeft, ChevronRight as ChevronRightNav, Maximize2, X, Info, Mail } from 'lucide-react';

interface ExpenseRecord {
  id: string;
  expensesId: string;
  date: string;
  amount: number;
  payee: string;
  category: string;
  description: string;
  invoiceNo: string;
  provider: string;
  photo?: string;
  processedBy: string;
  modifiedBy: string;
  modifiedDate: string;
  userEmail: string;
  receivedDate: string;
  supplier: string;
  city: string;
}

interface ExpensesLogDetailsProps {
  expenseRecord: ExpenseRecord;
}

const ExpensesLogDetails: React.FC<ExpensesLogDetailsProps> = ({
  expenseRecord
}) => {
  return (
    <div className="bg-gray-900 text-white h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white">
          {expenseRecord.date}
        </h1>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Trash2 size={18} />
          </button>
          <button className="p-2 text-white bg-orange-600 hover:bg-orange-700 rounded transition-colors">
            <Edit size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronRightNav size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Maximize2 size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Expense Details */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Date */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Date</span>
          <span className="text-white font-medium">{expenseRecord.date}</span>
        </div>

        {/* Expenses ID */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Expenses ID</span>
          <span className="text-white font-medium">{expenseRecord.expensesId}</span>
        </div>

        {/* Provider */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Provider</span>
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{expenseRecord.provider}</span>
            <Info size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Description */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Description</span>
          <span className="text-white font-medium">{expenseRecord.description}</span>
        </div>

        {/* Amount */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Amount</span>
          <span className="text-white font-medium text-lg">₱{expenseRecord.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Processed By */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Processed By</span>
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{expenseRecord.processedBy}</span>
            <Info size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Modified By */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Modified By</span>
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{expenseRecord.modifiedBy}</span>
            <Info size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Modified Date */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Modified Date</span>
          <span className="text-white font-medium">{expenseRecord.modifiedDate}</span>
        </div>

        {/* User Email */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">User Email</span>
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{expenseRecord.userEmail}</span>
            <Mail size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Payee */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Payee</span>
          <span className="text-white font-medium">{expenseRecord.payee}</span>
        </div>

        {/* Category */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Category</span>
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{expenseRecord.category}</span>
            <Info size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Invoice Number */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Invoice No.</span>
          <span className="text-red-400 font-medium">{expenseRecord.invoiceNo}</span>
        </div>

        {/* Received Date */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Received Date</span>
          <span className="text-white font-medium">{expenseRecord.receivedDate}</span>
        </div>

        {/* Supplier */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Supplier</span>
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{expenseRecord.supplier}</span>
            <Info size={16} className="text-gray-400" />
          </div>
        </div>

        {/* City */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">City</span>
          <span className="text-white font-medium">{expenseRecord.city}</span>
        </div>
      </div>
    </div>
  );
};

export default ExpensesLogDetails;

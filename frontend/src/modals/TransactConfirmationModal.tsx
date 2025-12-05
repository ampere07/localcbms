import React from 'react';

interface TransactConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  amount?: string;
  description?: string;
  billingRecord?: any;
}

const TransactConfirmationModal: React.FC<TransactConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  amount,
  description,
  billingRecord
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded shadow-lg p-6 max-w-md">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-white">Confirm Transaction</h3>
        </div>
        <div className="text-gray-300 mb-6">
          <p className="mb-2">Are you sure you want to proceed with this transaction?</p>
        </div>
        <div className="flex justify-end space-x-4">
          <button 
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
            onClick={onConfirm}
          >
            Confirm Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactConfirmationModal;
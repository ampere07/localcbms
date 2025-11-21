import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  percentage?: number;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ 
  isOpen, 
  message = 'Processing...', 
  percentage 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
          <p className="text-white text-center mb-2">{message}</p>
          
          {percentage !== undefined && (
            <div className="w-full">
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <p className="text-center text-orange-500 text-sm font-medium">
                {percentage}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;

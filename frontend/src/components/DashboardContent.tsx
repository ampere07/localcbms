import React from 'react';
import { TrendingUp, Users, Globe, Wifi, Ticket, Receipt } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const statsCards = [
    {
      title: "TODAY'S SALES",
      value: "₱0",
      subtitle: "0%",
      icon: TrendingUp
    },
    {
      title: "SUBSCRIPTIONS",
      value: "0",
      subtitle: "",
      icon: Users
    },
    {
      title: "IP ADDRESSES",
      value: "0",
      subtitle: "0 used IPs",
      icon: Globe
    },
    {
      title: "HOTSPOT USERS",
      value: "0",
      subtitle: "0 online",
      icon: Wifi
    },
    {
      title: "TOTAL TICKETS",
      value: "0",
      subtitle: "0 Open",
      icon: Ticket
    },
    {
      title: "INVOICES",
      value: "0",
      subtitle: "0 Unpaid",
      icon: Receipt
    }
  ];

  return (
    <div className="bg-gray-950 text-white">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Dashboard Overview
          </h2>
          <p className="text-gray-400 text-sm">
            Your business management system overview and key metrics
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statsCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div key={index} className="bg-gray-900 p-4 rounded border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  {card.title}
                </h3>
                <div className="text-2xl font-bold text-white mb-1">
                  {card.value}
                </div>
                {card.subtitle && (
                  <div className="text-sm text-gray-400">
                    {card.subtitle}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* System Statistics */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            SYSTEM STATISTICS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300 text-sm">Memory</span>
                <span className="text-white text-sm">0%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300 text-sm">Hard Disk Space</span>
                <span className="text-white text-sm">0%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300 text-sm">CPU</span>
                <span className="text-white text-sm">0%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              INVOICE SUMMARY
            </h3>
            <div className="h-48 flex items-center justify-center">
              <div className="relative w-full h-32">
                <svg className="w-full h-full">
                  <defs>
                    <linearGradient id="invoiceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#invoiceGradient)"
                    strokeWidth="2"
                    points="0,64 50,64 100,64 150,64 200,64 250,64 300,64 350,64 400,64"
                  />
                  {[0, 50, 100, 150, 200, 250, 300, 350, 400].map((x, i) => (
                    <circle key={i} cx={x} cy={64} r="3" fill="#06b6d4" />
                  ))}
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-400">2025-09-17</div>
              <div className="text-sm text-green-400">Grand Total: 0</div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              TRANSACTION SUMMARY
            </h3>
            <div className="h-48 flex items-center justify-center">
              <div className="relative w-full h-32">
                <svg className="w-full h-full">
                  <defs>
                    <linearGradient id="transactionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#transactionGradient)"
                    strokeWidth="2"
                    points="0,64 50,64 100,64 150,64 200,64 250,64 300,64 350,64 400,64"
                  />
                  {[0, 50, 100, 150, 200, 250, 300, 350, 400].map((x, i) => (
                    <circle key={i} cx={x} cy={64} r="3" fill="#10b981" />
                  ))}
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-400">2025-09-17</div>
              <div className="text-sm text-green-400">Grand Total: 0</div>
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-gray-900 rounded border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                RECENT TICKETS
              </h3>
              <button className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">SUBJECT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">CUSTOMER</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">CONTACT NUMBER</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">STATUS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">LAST UPDATED</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">PRIORITY</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">CATEGORY</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    You don't have any open tickets assigned to you.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;

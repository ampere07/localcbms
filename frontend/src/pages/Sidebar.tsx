import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, LogOut, ChevronRight, User, Building2, Shield, FileCheck, Wrench, Map, MapPinned , MapPin, Package, CreditCard, List, Router, DollarSign, Receipt, FileBarChart, Clock, Calendar, UserCheck, AlertTriangle, Tag, MessageSquare, Settings, Network, Activity } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  isCollapsed?: boolean;
  userRole: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: MenuItem[];
  allowedRoles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, onLogout, isCollapsed, userRole }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['administrator'] },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      allowedRoles: ['administrator'],
      children: [
        { id: 'customer', label: 'Customer', icon: User, allowedRoles: ['administrator'] },
        { id: 'transaction-list', label: 'Transaction List', icon: Receipt, allowedRoles: ['administrator'] },
        { id: 'payment-portal', label: 'Payment Portal', icon: DollarSign, allowedRoles: ['administrator'] },
        { id: 'soa', label: 'SOA', icon: FileText, allowedRoles: ['administrator'] },
        { id: 'invoice', label: 'Invoice', icon: Receipt, allowedRoles: ['administrator'] },
        { id: 'overdue', label: 'Overdue', icon: Clock, allowedRoles: ['administrator'] },
        { id: 'dc-notice', label: 'DC Notice', icon: AlertTriangle, allowedRoles: ['administrator'] },
        { id: 'mass-rebate', label: 'Rebates', icon: DollarSign, allowedRoles: ['administrator'] },
        { id: 'staggered-payment', label: 'Staggered', icon: Calendar, allowedRoles: ['administrator'] },
        { id: 'discounts', label: 'Discounts', icon: Tag, allowedRoles: ['administrator'] },
        { id: 'billing-config', label: 'Billing Configurations', icon: Receipt, allowedRoles: ['administrator'] }
      ]
    },
    {
      id: 'application',
      label: 'Application',
      icon: FileCheck,
      allowedRoles: ['administrator', 'technician'],
      children: [
        { id: 'application-management', label: 'Application', icon: FileCheck, allowedRoles: ['administrator'] },
        { id: 'application-visit', label: 'Application Visit', icon: MapPin, allowedRoles: ['administrator', 'technician'] },
        { id: 'promo-list', label: 'Promo', icon: Tag, allowedRoles: ['administrator'] },
        { id: 'plan-list', label: 'Plan', icon: List, allowedRoles: ['administrator'] },
        { id: 'location-list', label: 'Location', icon: MapPin, allowedRoles: ['administrator'] },
        { id: 'status-remarks-list', label: 'Status Remarks', icon: List, allowedRoles: ['administrator'] }
      ]
    },
    {
      id: 'job-order-group',
      label: 'Job Order',
      icon: Wrench,
      allowedRoles: ['administrator', 'technician'],
      children: [
        { id: 'job-order', label: 'Job Order', icon: Wrench, allowedRoles: ['administrator', 'technician'] },
        { id: 'lcp', label: 'LCP', icon: Network, allowedRoles: ['administrator'] },
        { id: 'nap', label: 'NAP', icon: Network, allowedRoles: ['administrator'] },
        { id: 'usage-type', label: 'Usage Type', icon: Activity, allowedRoles: ['administrator'] }
      ]
    },
    {
      id: 'sms',
      label: 'SMS',
      icon: MessageSquare,
      allowedRoles: ['administrator'],
      children: [
        { id: 'sms-blast', label: 'SMS Blast', icon: MessageSquare, allowedRoles: ['administrator'] },
        { id: 'sms-blast-logs', label: 'SMS Blast Logs', icon: List, allowedRoles: ['administrator'] }
      ]
    },
    {
      id: 'support',
      label: 'Support',
      icon: Wrench,
      allowedRoles: ['administrator', 'technician'],
      children: [
        { id: 'service-order', label: 'Service Order', icon: Wrench, allowedRoles: ['administrator', 'technician'] }
      ]
    },
    {
      id: 'inventory-group',
      label: 'Inventory',
      icon: Package,
      allowedRoles: ['administrator'],
      children: [
        { id: 'inventory', label: 'Inventory', icon: Package, allowedRoles: ['administrator'] },
        { id: 'inventory-category-list', label: 'Inventory Category List', icon: List, allowedRoles: ['administrator'] }
      ]
    },
    {
      id: 'technical',
      label: 'Technical',
      icon: Network,
      allowedRoles: ['administrator', 'technician'],
      children: [
        { id: 'lcp-nap-location', label: 'LCP/NAP Location', icon: MapPinned, allowedRoles: ['administrator', 'technician'] },
        { id: 'radius-config', label: 'Radius Config', icon: MapPin, allowedRoles: ['administrator'] }
      ]
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      allowedRoles: ['administrator'],
      children: [
        { id: 'user-management', label: 'Users Management', icon: User, allowedRoles: ['administrator'] },
        { id: 'organization-management', label: 'Organization Management', icon: Building2, allowedRoles: ['administrator'] },
        { id: 'group-management', label: 'Affiliate', icon: Shield, allowedRoles: ['administrator'] }
      ]
    },
    {
      id: 'logs',
      label: 'logs',
      icon: Users,
      allowedRoles: ['administrator'],
      children: [
        { id: 'expenses-log', label: 'Expenses Log', icon: FileBarChart, allowedRoles: ['administrator'] },
        { id: 'disconnected-logs', label: 'Disconnected Logs', icon: AlertTriangle, allowedRoles: ['administrator'] },
        { id: 'reconnection-logs', label: 'Reconnection Logs', icon: FileBarChart, allowedRoles: ['administrator'] },
        { id: 'logs', label: 'System Logs', icon: FileText, allowedRoles: ['administrator'] },
        { id: 'soa-generation', label: 'SOA Generation', icon: FileBarChart, allowedRoles: ['administrator'] },
        { id: 'invoice-generation', label: 'Invoice Generation', icon: Receipt, allowedRoles: ['administrator'] }
      ]
    },
    { id: 'settings', label: 'Settings', icon: Settings, allowedRoles: ['administrator', 'technician'] },
  ];

  const filterMenuByRole = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      if (!item.allowedRoles || item.allowedRoles.length === 0) {
        return true;
      }
      
      const normalizedUserRole = userRole ? userRole.toLowerCase().trim() : '';
      
      const hasAccess = item.allowedRoles.some(role => 
        role.toLowerCase().trim() === normalizedUserRole
      );
      
      if (hasAccess && item.children) {
        item.children = filterMenuByRole(item.children);
        if (item.children.length === 0) {
          return false;
        }
      }
      
      return hasAccess;
    });
  };

  const filteredMenuItems = filterMenuByRole(menuItems);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isChildActive = hasChildren && item.children!.some(child => activeSection === child.id);
    const isActive = activeSection === item.id || (level === 0 && isChildActive);
    const isCurrentItemActive = activeSection === item.id;
    const IconComponent = item.icon;

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              onSectionChange(item.id);
            }
          }}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
            level > 0 ? 'pl-8' : 'pl-4'
          } ${
            isCurrentItemActive
              ? 'bg-orange-500 bg-opacity-20 text-orange-400 border-r-2 border-orange-500'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center">
            <IconComponent className={`h-5 w-5 text-gray-400 ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && <span>{item.label}</span>}
          </div>
          {hasChildren && !isCollapsed && (
            <ChevronRight
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isExpanded ? 'transform rotate-90' : ''
              } ${isCollapsed ? 'hidden' : ''}`}
            />
          )}
        </button>
        
        {hasChildren && isExpanded && !isCollapsed && (
          <div>
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} h-full bg-gray-800 border-r border-gray-600 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}>
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-none" style={{ maxHeight: 'calc(100% - 80px)' }}>
        {filteredMenuItems.map(item => renderMenuItem(item))}
      </nav>
      
      <div className="p-4 border-t border-gray-600 flex-shrink-0">
        <button
          onClick={onLogout}
          className="w-full px-4 py-3 text-gray-300 hover:text-white border border-gray-500 rounded hover:bg-gray-700 transition-colors text-sm flex items-center justify-center"
        >
          <LogOut className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

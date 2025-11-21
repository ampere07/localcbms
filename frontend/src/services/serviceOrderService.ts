import apiClient from '../config/api';

// Response interface
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  table?: string;
  debug?: any;
}

export interface ServiceOrderData {
  id: string;
  Ticket_ID?: string;
  Timestamp?: string;
  Account_Number?: string;
  Full_Name?: string;
  Contact_Address?: string;
  Date_Installed?: string;
  Contact_Number?: string;
  Full_Address?: string;
  House_Front_Picture?: string;
  Email_Address?: string;
  Plan?: string;
  Provider?: string;
  Username?: string;
  Connection_Type?: string;
  Router_Modem_SN?: string;
  LCP?: string;
  NAP?: string;
  PORT?: string;
  VLAN?: string;
  Concern?: string;
  Concern_Remarks?: string;
  Visit_Status?: string;
  Visit_By?: string;
  Visit_With?: string;
  Visit_With_Other?: string;
  Visit_Remarks?: string;
  Modified_By?: string;
  Modified_Date?: string;
  User_Email?: string;
  Requested_By?: string;
  Assigned_Email?: string;
  Support_Remarks?: string;
  Service_Charge?: string;
  Repair_Category?: string;
  Support_Status?: string;
  created_at?: string;
  updated_at?: string;
}

export const createServiceOrder = async (serviceOrderData: ServiceOrderData) => {
  try {
    console.log('Creating new service order:', serviceOrderData);
    const response = await apiClient.post<ApiResponse<ServiceOrderData>>('/service-orders', serviceOrderData);
    return response.data;
  } catch (error) {
    console.error('Error creating service order:', error);
    throw error;
  }
};

export const getServiceOrders = async (assignedEmail?: string) => {
  try {
    console.log('Fetching service orders from service_orders table...');
    try {
      const params = assignedEmail ? { assigned_email: assignedEmail } : {};
      const response = await apiClient.get<ApiResponse<ServiceOrderData[]>>('/service-orders', { params });
      console.log('Raw API response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching service orders from /service-orders endpoint:', error);
      
      // Try alternate endpoint format without hyphen
      try {
        console.log('Trying alternate endpoint /service_orders...');
        const alternateResponse = await apiClient.get<ApiResponse<ServiceOrderData[]>>('/service_orders');
        return alternateResponse.data;
      } catch (altError) {
        console.error('Error fetching from alternate endpoint:', altError);
        // Continue to return formatted error response
      }
    }
    
    // If all endpoint attempts fail, return formatted error
    return {
      success: false,
      data: [],
      message: 'Service order API endpoints not available',
      table: 'service_orders' // Explicitly specify table name for debugging
    };
  } catch (error) {
    console.error('Error fetching service orders:', error);
    // Return a formatted error response instead of throwing
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Unknown error fetching service orders',
      table: 'service_orders' // Explicitly specify table name for debugging
    };
  }
};

export const getServiceOrder = async (id: string) => {
  try {
    const response = await apiClient.get<ApiResponse<ServiceOrderData>>(`/service-orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching service order:', error);
    throw error;
  }
};

export const updateServiceOrder = async (id: string, serviceOrderData: Partial<ServiceOrderData>) => {
  try {
    const response = await apiClient.put<ApiResponse<ServiceOrderData>>(`/service-orders/${id}`, serviceOrderData);
    return response.data;
  } catch (error) {
    console.error('Error updating service order:', error);
    throw error;
  }
};

export const deleteServiceOrder = async (id: string) => {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(`/service-orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting service order:', error);
    throw error;
  }
};
import apiClient from '../config/api';

export interface BillingStatus {
    id: number;
    status_name: string;
}

export const billingStatusService = {
    getAll: async () => {
        const response = await apiClient.get('/billing-statuses');
        return response.data;
    }
};

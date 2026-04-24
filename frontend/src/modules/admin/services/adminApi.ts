// Service API pour le module administration
import axios from 'axios';
import type {
  DashboardStats,
  InventoryItem,
  InventoryTransaction,
  Staff,
  SalesReport,
  ReservationManagement,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminApi = {
  // Dashboard
  async getDashboardStats(params: {
    restaurantId: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get<DashboardStats>('/admin/dashboard/stats', { params });
    return response.data;
  },

  // Inventaire
  async getInventory(params: {
    restaurantId: string;
    lowStock?: boolean;
    page?: number;
    size?: number;
  }) {
    const response = await api.get<{
      items: InventoryItem[];
      totalElements: number;
      totalPages: number;
    }>('/admin/inventory', { params });
    return response.data;
  },

  async getInventoryItem(itemId: string) {
    const response = await api.get<InventoryItem>(`/admin/inventory/${itemId}`);
    return response.data;
  },

  async createInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
    const response = await api.post<InventoryItem>('/admin/inventory', item);
    return response.data;
  },

  async updateInventoryItem(itemId: string, updates: Partial<InventoryItem>) {
    const response = await api.put<InventoryItem>(`/admin/inventory/${itemId}`, updates);
    return response.data;
  },

  async deleteInventoryItem(itemId: string) {
    await api.delete(`/admin/inventory/${itemId}`);
  },

  async recordInventoryTransaction(transaction: {
    itemId: string;
    transactionType: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    reason?: string;
    performedBy: string;
  }) {
    const response = await api.post<InventoryTransaction>(
      `/admin/inventory/${transaction.itemId}/transaction`,
      transaction
    );
    return response.data;
  },

  async getInventoryAlerts(restaurantId: string) {
    const response = await api.get<InventoryItem[]>('/admin/inventory/alerts', {
      params: { restaurantId },
    });
    return response.data;
  },

  // Personnel
  async getStaff(restaurantId: string) {
    const response = await api.get<Staff[]>('/admin/staff', {
      params: { restaurantId },
    });
    return response.data;
  },

  async getStaffMember(staffId: string) {
    const response = await api.get<Staff>(`/admin/staff/${staffId}`);
    return response.data;
  },

  async createStaff(staff: Omit<Staff, 'id' | 'createdAt' | 'user'>) {
    const response = await api.post<Staff>('/admin/staff', staff);
    return response.data;
  },

  async updateStaff(staffId: string, updates: Partial<Staff>) {
    const response = await api.put<Staff>(`/admin/staff/${staffId}`, updates);
    return response.data;
  },

  async deleteStaff(staffId: string) {
    await api.delete(`/admin/staff/${staffId}`);
  },

  // Réservations (gestion admin)
  async getAllReservations(params: {
    restaurantId: string;
    date?: string;
    status?: string;
    page?: number;
    size?: number;
  }) {
    const response = await api.get<{
      content: ReservationManagement[];
      totalElements: number;
      totalPages: number;
    }>('/admin/reservations', { params });
    return response.data;
  },

  async confirmReservation(reservationId: string) {
    const response = await api.post(`/admin/reservations/${reservationId}/confirm`);
    return response.data;
  },

  async cancelReservation(reservationId: string, reason: string) {
    const response = await api.post(`/admin/reservations/${reservationId}/cancel`, { reason });
    return response.data;
  },

  // Rapports de ventes
  async getSalesReport(params: {
    restaurantId: string;
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const response = await api.get<SalesReport[]>('/admin/reports/sales', { params });
    return response.data;
  },

  async exportSalesReport(params: {
    restaurantId: string;
    startDate: string;
    endDate: string;
    format: 'csv' | 'pdf' | 'excel';
  }) {
    const response = await api.get('/admin/reports/sales/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

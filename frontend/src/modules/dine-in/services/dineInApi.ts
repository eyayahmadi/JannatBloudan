// Service API pour le module sur place
import axios from 'axios';
import type {
  Table,
  Reservation,
  TableSession,
  TableTransfer,
  TableAvailability,
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

export const dineInApi = {
  // Réservations
  async createReservation(reservation: {
    userId?: string;
    restaurantId: string;
    reservationDate: string;
    reservationTime: string;
    partySize: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    specialRequests?: string;
  }) {
    const response = await api.post<Reservation>('/dine-in/reservations', reservation);
    return response.data;
  },

  async getReservation(reservationId: string) {
    const response = await api.get<Reservation>(`/dine-in/reservations/${reservationId}`);
    return response.data;
  },

  async getUserReservations(userId: string) {
    const response = await api.get<Reservation[]>(
      `/dine-in/reservations/user/${userId}`
    );
    return response.data;
  },

  async updateReservation(reservationId: string, updates: Partial<Reservation>) {
    const response = await api.put<Reservation>(
      `/dine-in/reservations/${reservationId}`,
      updates
    );
    return response.data;
  },

  async cancelReservation(reservationId: string, reason?: string) {
    const response = await api.delete(`/dine-in/reservations/${reservationId}`, {
      data: { reason },
    });
    return response.data;
  },

  // Disponibilité des tables
  async getAvailableTables(params: {
    restaurantId: string;
    date: string;
    time: string;
    partySize: number;
  }) {
    const response = await api.get<{
      availableTables: Table[];
      alternativeTimes: string[];
    }>('/dine-in/tables', { params });
    return response.data;
  },

  async getTableAvailability(restaurantId: string, date: string) {
    const response = await api.get<TableAvailability>(
      `/dine-in/tables/availability`,
      {
        params: { restaurantId, date },
      }
    );
    return response.data;
  },

  async getTable(tableId: string) {
    const response = await api.get<Table>(`/dine-in/tables/${tableId}`);
    return response.data;
  },

  // Sessions de table
  async startSession(data: {
    tableId: string;
    reservationId?: string;
    customerCount: number;
  }) {
    const response = await api.post<TableSession>('/dine-in/sessions', data);
    return response.data;
  },

  async getSession(sessionId: string) {
    const response = await api.get<TableSession>(`/dine-in/sessions/${sessionId}`);
    return response.data;
  },

  async endSession(sessionId: string) {
    const response = await api.put(`/dine-in/sessions/${sessionId}/end`);
    return response.data;
  },

  // Transfert de table
  async transferTable(sessionId: string, data: {
    toTableId: string;
    reason: string;
  }) {
    const response = await api.post<TableTransfer>(
      `/dine-in/sessions/${sessionId}/transfer`,
      data
    );
    return response.data;
  },

  // Menu via QR Code
  async getMenuByQR(tableId: string) {
    const response = await api.get(`/dine-in/menu/qr/${tableId}`);
    return response.data;
  },

  // Commande depuis la table
  async placeTableOrder(sessionId: string, order: {
    items: Array<{
      menuItemId: string;
      quantity: number;
      variantId?: string;
      addons?: string[];
    }>;
    specialInstructions?: string;
  }) {
    const response = await api.post(`/dine-in/sessions/${sessionId}/order`, order);
    return response.data;
  },

  // Paiement sur place
  async requestBill(sessionId: string) {
    const response = await api.post(`/dine-in/sessions/${sessionId}/bill`);
    return response.data;
  },

  async payBill(sessionId: string, payment: {
    paymentMethod: 'CARD' | 'CASH' | 'SPLIT';
    tipAmount?: number;
    splitPayment?: boolean;
  }) {
    const response = await api.post(
      `/dine-in/sessions/${sessionId}/payment`,
      payment
    );
    return response.data;
  },
};

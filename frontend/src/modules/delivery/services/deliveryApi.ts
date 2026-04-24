// Service API pour le module de livraison
import axios from 'axios';
import type {
  MenuItem,
  Category,
  CartItem,
  Order,
  OrderTracking,
  DeliveryAddress,
  Recommendation
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

export const deliveryApi = {
  // Menu
  async getMenu(params: {
    restaurantId: string;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    dietary?: string[];
    page?: number;
    size?: number;
  }) {
    const response = await api.get<{
      content: MenuItem[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>('/delivery/menu', { params });
    return response.data;
  },

  async getMenuItem(id: string) {
    const response = await api.get<MenuItem>(`/delivery/menu/${id}`);
    return response.data;
  },

  async getCategories(restaurantId: string) {
    const response = await api.get<Category[]>('/delivery/categories', {
      params: { restaurantId },
    });
    return response.data;
  },

  // Panier
  async addToCart(cartItem: {
    userId: string;
    menuItemId: string;
    quantity: number;
    variantId?: string;
    addons?: string[];
    specialInstructions?: string;
  }) {
    const response = await api.post('/delivery/cart', cartItem);
    return response.data;
  },

  async getCart(userId: string) {
    const response = await api.get<CartItem[]>(`/delivery/cart/${userId}`);
    return response.data;
  },

  async updateCartItem(cartItemId: string, quantity: number) {
    const response = await api.put(`/delivery/cart/${cartItemId}`, { quantity });
    return response.data;
  },

  async removeFromCart(cartItemId: string) {
    await api.delete(`/delivery/cart/${cartItemId}`);
  },

  async clearCart(userId: string) {
    await api.delete(`/delivery/cart/${userId}/clear`);
  },

  // Commandes
  async createOrder(order: {
    userId: string;
    restaurantId: string;
    orderType: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      variantId?: string;
      addons?: string[];
    }>;
    deliveryAddressId?: string;
    deliveryInstructions?: string;
    paymentMethod: string;
    specialInstructions?: string;
  }) {
    const response = await api.post<Order>('/delivery/orders', order);
    return response.data;
  },

  async getOrder(orderId: string) {
    const response = await api.get<Order>(`/delivery/orders/${orderId}`);
    return response.data;
  },

  async getUserOrders(userId: string, page = 0, size = 10) {
    const response = await api.get<{
      content: Order[];
      totalElements: number;
      totalPages: number;
    }>(`/delivery/orders/user/${userId}`, {
      params: { page, size },
    });
    return response.data;
  },

  async trackOrder(orderId: string) {
    const response = await api.get<OrderTracking>(`/delivery/orders/${orderId}/tracking`);
    return response.data;
  },

  async cancelOrder(orderId: string, reason: string) {
    const response = await api.post(`/delivery/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  async submitReview(orderId: string, review: {
    rating: number;
    review: string;
    foodQuality: number;
    deliverySpeed: number;
    packaging: number;
  }) {
    const response = await api.post(`/delivery/orders/${orderId}/review`, review);
    return response.data;
  },

  // Adresses
  async getAddresses(userId: string) {
    const response = await api.get<DeliveryAddress[]>(`/delivery/addresses/${userId}`);
    return response.data;
  },

  async addAddress(address: Omit<DeliveryAddress, 'id'> & { userId: string }) {
    const response = await api.post<DeliveryAddress>('/delivery/addresses', address);
    return response.data;
  },

  async updateAddress(addressId: string, address: Partial<DeliveryAddress>) {
    const response = await api.put<DeliveryAddress>(`/delivery/addresses/${addressId}`, address);
    return response.data;
  },

  async deleteAddress(addressId: string) {
    await api.delete(`/delivery/addresses/${addressId}`);
  },

  // Recommandations IA
  async getRecommendations(userId: string) {
    const response = await api.get<{ recommendations: Recommendation[] }>(
      `/delivery/recommendations/${userId}`
    );
    return response.data;
  },
};

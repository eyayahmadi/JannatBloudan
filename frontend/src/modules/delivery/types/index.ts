// Types pour le module de livraison

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];
  categoryId: string;
  categoryName: string;
  preparationTime: number;
  calories?: number;
  allergens?: string[];
  dietaryInfo?: string[];
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  priceAdjustment: number;
  isAvailable: boolean;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  variantId?: string;
  variantName?: string;
  addons: MenuItemAddon[];
  specialInstructions?: string;
  subtotal: number;
}

export interface DeliveryAddress {
  id: string;
  label: string;
  streetAddress: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  orderType: 'DELIVERY' | 'DINE_IN' | 'TAKEAWAY';
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  total: number;
  deliveryAddress?: DeliveryAddress;
  deliveryInstructions?: string;
  estimatedDeliveryTime?: string;
  specialInstructions?: string;
  paymentStatus: string;
  createdAt: string;
}

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  variant?: MenuItemVariant;
  addons: MenuItemAddon[];
  specialInstructions?: string;
}

export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  timeline: OrderTrackingEvent[];
  estimatedDeliveryTime?: string;
  driverLocation?: {
    lat: number;
    lng: number;
  };
}

export interface OrderTrackingEvent {
  status: OrderStatus;
  message: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Recommendation {
  menuItem: MenuItem;
  score: number;
  reason: string;
}

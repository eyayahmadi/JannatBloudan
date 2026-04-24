// Types pour le module administration

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: TopSellingItem[];
  ordersByType: {
    delivery: number;
    dineIn: number;
    takeaway: number;
  };
  revenueByDay: RevenueByDay[];
  revenueGrowth: number;
  ordersGrowth: number;
}

export interface TopSellingItem {
  menuItem: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
  };
  quantitySold: number;
  revenue: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  orders: number;
}

export interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitCost: number;
  supplierName?: string;
  supplierContact?: string;
  lastRestocked?: string;
  status: 'OK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  transactionType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  referenceId?: string;
  performedBy: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  restaurantId: string;
  position: string;
  hireDate: string;
  salary: number;
  schedule?: Record<string, any>;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  createdAt: string;
}

export interface SalesReport {
  id: string;
  restaurantId: string;
  reportDate: string;
  totalOrders: number;
  totalRevenue: number;
  totalDeliveryOrders: number;
  totalDineInOrders: number;
  totalTakeawayOrders: number;
  averageOrderValue: number;
  topSellingItems: any[];
  metrics: Record<string, any>;
  createdAt: string;
}

export interface ReservationManagement {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  status: string;
  tableNumber?: string;
  specialRequests?: string;
}

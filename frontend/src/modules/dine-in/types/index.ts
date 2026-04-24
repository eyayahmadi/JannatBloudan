// Types pour le module expérience sur place

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  floor: string;
  section: string;
  status: TableStatus;
  qrCode?: string;
  positionX?: number;
  positionY?: number;
  isActive: boolean;
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface Reservation {
  id: string;
  restaurantId: string;
  userId?: string;
  tableId?: string;
  table?: Table;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  status: ReservationStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialRequests?: string;
  reminderSent: boolean;
  confirmedAt?: string;
  seatedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export type ReservationStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface TableSession {
  id: string;
  tableId: string;
  table: Table;
  reservationId?: string;
  orderId?: string;
  startedAt: string;
  endedAt?: string;
  customerCount: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface TableTransfer {
  id: string;
  sessionId: string;
  fromTableId: string;
  fromTable: Table;
  toTableId: string;
  toTable: Table;
  reason: string;
  transferredBy: string;
  transferredAt: string;
}

export interface AvailableTimeSlot {
  time: string;
  availableTables: number;
}

export interface TableAvailability {
  date: string;
  availableSlots: AvailableTimeSlot[];
}

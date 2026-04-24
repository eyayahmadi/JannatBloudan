export interface Event {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  type: EventType;
  startDateTime: string;
  endDateTime: string;
  maxCapacity: number;
  currentBookings: number;
  pricePerPerson: number;
  status: EventStatus;
  imageUrl?: string;
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

export enum EventType {
  WEDDING = 'WEDDING',
  BIRTHDAY = 'BIRTHDAY',
  CORPORATE = 'CORPORATE',
  PRIVATE_DINING = 'PRIVATE_DINING',
  WORKSHOP = 'WORKSHOP',
  LIVE_MUSIC = 'LIVE_MUSIC',
  THEMED_DINNER = 'THEMED_DINNER',
  OTHER = 'OTHER'
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FULL = 'FULL',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface EventBooking {
  id: string;
  eventId: string;
  userId: string;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  specialRequests?: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

export interface EventReminder {
  id: string;
  bookingId: string;
  scheduledFor: string;
  sentAt?: string;
  status: ReminderStatus;
  type: ReminderType;
}

export enum ReminderStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

export enum ReminderType {
  CONFIRMATION = 'CONFIRMATION',
  ONE_DAY_BEFORE = 'ONE_DAY_BEFORE',
  THREE_HOURS_BEFORE = 'THREE_HOURS_BEFORE'
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: EventType;
  status: EventStatus;
  capacity: string;
}

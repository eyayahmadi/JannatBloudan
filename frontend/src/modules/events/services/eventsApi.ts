import axios from 'axios';
import { Event, EventBooking, EventReminder, CalendarEvent } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

const eventsApi = {
  // Event Management
  getAllEvents: async (restaurantId: string, filters?: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await axios.get<Event[]>(
      `${API_BASE_URL}/restaurants/${restaurantId}/events?${params.toString()}`
    );
    return response.data;
  },

  getEventById: async (eventId: string) => {
    const response = await axios.get<Event>(`${API_BASE_URL}/events/${eventId}`);
    return response.data;
  },

  createEvent: async (restaurantId: string, eventData: Partial<Event>) => {
    const response = await axios.post<Event>(
      `${API_BASE_URL}/restaurants/${restaurantId}/events`,
      eventData
    );
    return response.data;
  },

  updateEvent: async (eventId: string, eventData: Partial<Event>) => {
    const response = await axios.put<Event>(
      `${API_BASE_URL}/events/${eventId}`,
      eventData
    );
    return response.data;
  },

  deleteEvent: async (eventId: string) => {
    await axios.delete(`${API_BASE_URL}/events/${eventId}`);
  },

  // Event Bookings
  getEventBookings: async (eventId: string) => {
    const response = await axios.get<EventBooking[]>(
      `${API_BASE_URL}/events/${eventId}/bookings`
    );
    return response.data;
  },

  createBooking: async (eventId: string, bookingData: {
    numberOfGuests: number;
    specialRequests?: string;
  }) => {
    const response = await axios.post<EventBooking>(
      `${API_BASE_URL}/events/${eventId}/bookings`,
      bookingData
    );
    return response.data;
  },

  cancelBooking: async (bookingId: string) => {
    const response = await axios.put<EventBooking>(
      `${API_BASE_URL}/bookings/${bookingId}/cancel`
    );
    return response.data;
  },

  getUserBookings: async (userId: string) => {
    const response = await axios.get<EventBooking[]>(
      `${API_BASE_URL}/users/${userId}/event-bookings`
    );
    return response.data;
  },

  // Calendar
  getCalendarEvents: async (restaurantId: string, startDate: string, endDate: string) => {
    const response = await axios.get<CalendarEvent[]>(
      `${API_BASE_URL}/restaurants/${restaurantId}/calendar?start=${startDate}&end=${endDate}`
    );
    return response.data;
  },

  // Reminders
  getEventReminders: async (eventId: string) => {
    const response = await axios.get<EventReminder[]>(
      `${API_BASE_URL}/events/${eventId}/reminders`
    );
    return response.data;
  },

  scheduleReminder: async (bookingId: string, reminderData: {
    type: string;
    scheduledFor: string;
  }) => {
    const response = await axios.post<EventReminder>(
      `${API_BASE_URL}/bookings/${bookingId}/reminders`,
      reminderData
    );
    return response.data;
  },

  // Analytics
  getEventAnalytics: async (restaurantId: string, startDate: string, endDate: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/restaurants/${restaurantId}/events/analytics?start=${startDate}&end=${endDate}`
    );
    return response.data;
  }
};

export default eventsApi;

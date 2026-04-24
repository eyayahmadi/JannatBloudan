import React, { useState, useEffect } from 'react';
import { Plus, CalendarIcon, List } from 'lucide-react';
import { Event } from '../types';
import eventsApi from '../services/eventsApi';
import { EventCalendar } from '../components/EventCalendar';
import { EventCard } from '../components/EventCard';

export const EventManagementPage: React.FC = () => {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const restaurantId = 'restaurant-123'; // From auth context

  useEffect(() => {
    if (view === 'list') {
      loadEvents();
    }
  }, [view]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsApi.getAllEvents(restaurantId);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    // Navigate to event details or open modal
  };

  const handleCreateEvent = () => {
    // Navigate to create event page
    console.log('Create new event');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Événements</h1>
            <p className="text-gray-600">
              Planifiez et gérez vos événements spéciaux
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  view === 'calendar'
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Calendrier
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  view === 'list'
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
                Liste
              </button>
            </div>

            <button
              onClick={handleCreateEvent}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouvel événement
            </button>
          </div>
        </div>

        {view === 'calendar' ? (
          <EventCalendar
            restaurantId={restaurantId}
            onEventClick={handleEventClick}
          />
        ) : (
          <div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEventClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

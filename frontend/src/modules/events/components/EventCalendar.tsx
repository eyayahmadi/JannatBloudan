import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { CalendarEvent, EventType, EventStatus } from '../types';
import eventsApi from '../services/eventsApi';

interface EventCalendarProps {
  restaurantId: string;
  onEventClick?: (eventId: string) => void;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ restaurantId, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'month' | 'week'>('month');

  useEffect(() => {
    loadEvents();
  }, [currentDate, view]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      
      const data = await eventsApi.getCalendarEvents(
        restaurantId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      setEvents(data);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    if (view === 'month') {
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day;
    return new Date(currentDate.setDate(diff));
  };

  const getViewEndDate = () => {
    if (view === 'month') {
      return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + 6;
    return new Date(currentDate.setDate(diff));
  };

  const previousPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    }
  };

  const nextPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    }
  };

  const getEventTypeColor = (type: EventType) => {
    const colors = {
      [EventType.WEDDING]: 'bg-pink-500',
      [EventType.BIRTHDAY]: 'bg-yellow-500',
      [EventType.CORPORATE]: 'bg-blue-500',
      [EventType.PRIVATE_DINING]: 'bg-purple-500',
      [EventType.WORKSHOP]: 'bg-green-500',
      [EventType.LIVE_MUSIC]: 'bg-red-500',
      [EventType.THEMED_DINNER]: 'bg-orange-500',
      [EventType.OTHER]: 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={previousPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={nextPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semaine
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-700">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((date, index) => {
              const dayEvents = getEventsForDay(date);
              const isToday = date && date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`min-h-24 p-2 border rounded-lg ${
                    date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${isToday ? 'border-primary border-2' : 'border-gray-200'}`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-primary' : 'text-gray-700'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            onClick={() => onEventClick?.(event.id)}
                            className={`text-xs p-1 rounded cursor-pointer ${getEventTypeColor(
                              event.type
                            )} text-white truncate`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} autres
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.values(EventType).map(type => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${getEventTypeColor(type)}`}></div>
              <span className="text-gray-700">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

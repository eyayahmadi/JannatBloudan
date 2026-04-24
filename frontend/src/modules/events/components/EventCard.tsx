import React from 'react';
import { Calendar, Users, MapPin, Clock, DollarSign } from 'lucide-react';
import { Event, EventType, EventStatus } from '../types';

interface EventCardProps {
  event: Event;
  onBook?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onBook, onEdit }) => {
  const getStatusBadge = () => {
    const statusColors = {
      [EventStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [EventStatus.PUBLISHED]: 'bg-green-100 text-green-800',
      [EventStatus.FULL]: 'bg-red-100 text-red-800',
      [EventStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [EventStatus.COMPLETED]: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
        {event.status}
      </span>
    );
  };

  const getTypeLabel = () => {
    const labels = {
      [EventType.WEDDING]: 'Mariage',
      [EventType.BIRTHDAY]: 'Anniversaire',
      [EventType.CORPORATE]: 'Événement d\'entreprise',
      [EventType.PRIVATE_DINING]: 'Dîner privé',
      [EventType.WORKSHOP]: 'Atelier',
      [EventType.LIVE_MUSIC]: 'Musique live',
      [EventType.THEMED_DINNER]: 'Dîner à thème',
      [EventType.OTHER]: 'Autre'
    };
    return labels[event.type] || event.type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const availableSpots = event.maxCapacity - event.currentBookings;
  const isAvailable = event.status === EventStatus.PUBLISHED && availableSpots > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {event.imageUrl && (
        <div className="h-48 bg-gray-200 relative">
          <img
            src={event.imageUrl || "/placeholder.svg"}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4">
            {getStatusBadge()}
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{event.name}</h3>
            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
              {getTypeLabel()}
            </span>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(event.startDateTime)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>
              {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 text-gray-400" />
            <span>
              {event.currentBookings} / {event.maxCapacity} participants
            </span>
            {availableSpots <= 5 && availableSpots > 0 && (
              <span className="text-orange-600 font-medium">
                ({availableSpots} places restantes)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{event.pricePerPerson} € / personne</span>
          </div>
        </div>

        {event.requirements && event.requirements.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Exigences:</p>
            <div className="flex flex-wrap gap-1">
              {event.requirements.map((req, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {isAvailable && onBook && (
            <button
              onClick={() => onBook(event.id)}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Réserver
            </button>
          )}
          {!isAvailable && event.status === EventStatus.FULL && (
            <button
              disabled
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium"
            >
              Complet
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(event.id)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

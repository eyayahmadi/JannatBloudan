import React, { useState } from 'react';
import { X, Users, CreditCard, AlertCircle } from 'lucide-react';
import { Event } from '../types';
import eventsApi from '../services/eventsApi';

interface EventBookingModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export const EventBookingModal: React.FC<EventBookingModalProps> = ({
  event,
  onClose,
  onSuccess
}) => {
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableSpots = event.maxCapacity - event.currentBookings;
  const totalPrice = numberOfGuests * event.pricePerPerson;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (numberOfGuests > availableSpots) {
      setError(`Seulement ${availableSpots} places disponibles`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await eventsApi.createBooking(event.id, {
        numberOfGuests,
        specialRequests: specialRequests || undefined
      });
      onSuccess();
    } catch (err) {
      setError('Échec de la réservation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Réserver l'événement</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">{event.name}</h3>
            <p className="text-sm text-gray-600">{event.description}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(event.startDateTime).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Heure:</span>
              <span className="font-medium text-gray-900">
                {new Date(event.startDateTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Places disponibles:</span>
              <span className="font-medium text-gray-900">{availableSpots}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Prix par personne:</span>
              <span className="font-medium text-gray-900">{event.pricePerPerson} €</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de participants
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setNumberOfGuests(Math.max(1, numberOfGuests - 1))}
                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                -
              </button>
              <div className="flex items-center gap-2 flex-1 justify-center">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-2xl font-semibold text-gray-900">{numberOfGuests}</span>
              </div>
              <button
                type="button"
                onClick={() => setNumberOfGuests(Math.min(availableSpots, numberOfGuests + 1))}
                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demandes spéciales (optionnel)
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Allergies, besoins diététiques, etc."
            />
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900">Total:</span>
              </div>
              <span className="text-2xl font-bold text-primary">{totalPrice} €</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Réservation...' : 'Confirmer et payer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

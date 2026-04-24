import React, { useState, useEffect } from 'react';
import { dineInApi } from '../services/dineInApi';
import type { Table } from '../types';

interface ReservationFormProps {
  restaurantId: string;
  onSuccess: (reservationId: string) => void;
  onCancel?: () => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  restaurantId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    partySize: 2,
    specialRequests: '',
  });

  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [alternativeTimes, setAlternativeTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (formData.reservationDate && formData.reservationTime && formData.partySize) {
      checkAvailability();
    }
  }, [formData.reservationDate, formData.reservationTime, formData.partySize]);

  const checkAvailability = async () => {
    try {
      setCheckingAvailability(true);
      const data = await dineInApi.getAvailableTables({
        restaurantId,
        date: formData.reservationDate,
        time: formData.reservationTime,
        partySize: formData.partySize,
      });
      setAvailableTables(data.availableTables);
      setAlternativeTimes(data.alternativeTimes);
      setError('');
    } catch (err) {
      console.error('Error checking availability:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const reservation = await dineInApi.createReservation({
        restaurantId,
        ...formData,
      });
      onSuccess(reservation.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Réserver une table
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Date et Heure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date
            </label>
            <input
              type="date"
              required
              min={today}
              value={formData.reservationDate}
              onChange={(e) =>
                setFormData({ ...formData, reservationDate: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Heure
            </label>
            <input
              type="time"
              required
              value={formData.reservationTime}
              onChange={(e) =>
                setFormData({ ...formData, reservationTime: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Nombre de personnes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Nombre de personnes
          </label>
          <select
            value={formData.partySize}
            onChange={(e) =>
              setFormData({ ...formData, partySize: Number(e.target.value) })
            }
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
              <option key={size} value={size}>
                {size} {size === 1 ? 'personne' : 'personnes'}
              </option>
            ))}
          </select>
        </div>

        {/* Disponibilité */}
        {checkingAvailability ? (
          <div className="mb-4 p-4 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground">Vérification de la disponibilité...</p>
          </div>
        ) : availableTables.length === 0 && formData.reservationDate && formData.reservationTime ? (
          <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-2">
              Aucune table disponible à cette heure
            </p>
            {alternativeTimes.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Horaires alternatifs:</p>
                <div className="flex flex-wrap gap-2">
                  {alternativeTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData({ ...formData, reservationTime: time })}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm hover:bg-primary/90"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : availableTables.length > 0 ? (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-green-800 dark:text-green-200 text-sm">
              {availableTables.length} table(s) disponible(s) pour {formData.partySize} personne(s)
            </p>
          </div>
        ) : null}

        {/* Informations du client */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom complet
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              placeholder="Jean Dupont"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.customerEmail}
              onChange={(e) =>
                setFormData({ ...formData, customerEmail: e.target.value })
              }
              placeholder="jean.dupont@example.com"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
              placeholder="+33 6 12 34 56 78"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Demandes spéciales */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Demandes spéciales (optionnel)
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) =>
              setFormData({ ...formData, specialRequests: e.target.value })
            }
            rows={3}
            placeholder="Allergies, préférence de siège, célébration..."
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || availableTables.length === 0}
            className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Réservation en cours...' : 'Confirmer la réservation'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

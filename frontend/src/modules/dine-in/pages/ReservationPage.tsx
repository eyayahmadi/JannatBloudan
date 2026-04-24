import React, { useState } from 'react';
import { ReservationForm } from '../components/ReservationForm';
import { TableMap } from '../components/TableMap';
import type { Table } from '../types';

export const ReservationPage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reservationId, setReservationId] = useState<string>('');

  const restaurantId = 'demo-restaurant-id'; // Would come from route or context

  const handleReservationSuccess = (id: string) => {
    setReservationId(id);
    setShowConfirmation(true);
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            Réservation confirmée!
          </h2>
          <p className="text-muted-foreground mb-6">
            Votre réservation a été enregistrée avec succès. Un email de confirmation
            vous a été envoyé.
          </p>

          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm text-muted-foreground mb-1">
              Numéro de réservation
            </p>
            <p className="text-lg font-mono font-semibold text-foreground">
              {reservationId.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/reservations'}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Voir mes réservations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Réserver une table
          </h1>
          <p className="text-muted-foreground">
            Choisissez votre date, heure et le nombre de personnes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire de réservation */}
          <div>
            <ReservationForm
              restaurantId={restaurantId}
              onSuccess={handleReservationSuccess}
            />
          </div>

          {/* Plan de salle */}
          <div>
            <TableMap
              restaurantId={restaurantId}
              onTableSelect={setSelectedTable}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

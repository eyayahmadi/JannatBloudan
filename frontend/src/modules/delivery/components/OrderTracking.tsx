import React, { useState, useEffect } from 'react';
import { deliveryApi } from '../services/deliveryApi';
import type { OrderTracking as OrderTrackingType, OrderStatus } from '../types';

interface OrderTrackingProps {
  orderId: string;
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const statusIcons: Record<OrderStatus, string> = {
  PENDING: '⏳',
  CONFIRMED: '✓',
  PREPARING: '👨‍🍳',
  READY: '📦',
  OUT_FOR_DELIVERY: '🚗',
  DELIVERED: '✓',
  CANCELLED: '✕',
};

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId }) => {
  const [tracking, setTracking] = useState<OrderTrackingType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracking();
    const interval = setInterval(loadTracking, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  const loadTracking = async () => {
    try {
      const data = await deliveryApi.trackOrder(orderId);
      setTracking(data);
    } catch (error) {
      console.error('Error loading tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Impossible de charger le suivi de commande</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-primary text-primary-foreground">
        <h2 className="text-xl font-bold mb-1">Suivi de commande</h2>
        <p className="text-sm opacity-90">Commande #{orderId.slice(0, 8)}</p>
      </div>

      {/* Current Status */}
      <div className="px-6 py-6 bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl">
            {statusIcons[tracking.status]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {statusLabels[tracking.status]}
            </h3>
            {tracking.estimatedDeliveryTime && (
              <p className="text-sm text-muted-foreground">
                Livraison estimée:{' '}
                {new Date(tracking.estimatedDeliveryTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Historique</h3>
        <div className="space-y-6">
          {tracking.timeline.map((event, index) => (
            <div key={index} className="flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                  }`}
                />
                {index < tracking.timeline.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-2" />
                )}
              </div>

              {/* Event details */}
              <div className="flex-1 pb-6">
                <p className="font-medium text-foreground">{event.message}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(event.timestamp).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map placeholder for driver location */}
      {tracking.driverLocation && (
        <div className="px-6 py-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Position du livreur
          </h3>
          <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">
              Carte: {tracking.driverLocation.lat}, {tracking.driverLocation.lng}
            </p>
            {/* Intégrer Google Maps ou Mapbox ici */}
          </div>
        </div>
      )}
    </div>
  );
};

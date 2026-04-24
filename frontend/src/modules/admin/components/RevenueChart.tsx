import React from 'react';
import type { RevenueByDay } from '../types';

interface RevenueChartProps {
  data: RevenueByDay[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const maxOrders = Math.max(...data.map((d) => d.orders));

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Évolution du chiffre d'affaires</h3>

      <div className="space-y-4">
        {data.map((day, index) => {
          const revenuePercentage = (day.revenue / maxRevenue) * 100;
          const ordersPercentage = (day.orders / maxOrders) * 100;

          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-foreground font-medium">
                    {day.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {day.orders} cmd
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${revenuePercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded" />
          <span className="text-muted-foreground">Revenu</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { DashboardStats } from '../components/DashboardStats';
import { RevenueChart } from '../components/RevenueChart';
import type { DashboardStats as DashboardStatsType } from '../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const restaurantId = 'demo-restaurant-id'; // Would come from context

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboardStats({
        restaurantId,
        ...dateRange,
      });
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Vue d'ensemble de votre activité
            </p>
          </div>

          {/* Date Range Picker */}
          <div className="flex gap-3">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-muted-foreground self-center">à</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <DashboardStats stats={stats!} loading={loading} />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2">
            {stats && <RevenueChart data={stats.revenueByDay} />}
          </div>

          {/* Order Types Distribution */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Répartition des commandes
            </h3>
            {stats && (
              <div className="space-y-4">
                {Object.entries(stats.ordersByType).map(([type, count]) => {
                  const total = Object.values(stats.ordersByType).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(1);
                  
                  const labels: Record<string, string> = {
                    delivery: 'Livraison',
                    dineIn: 'Sur place',
                    takeaway: 'À emporter',
                  };

                  return (
                    <div key={type}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          {labels[type]}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        {stats && stats.topSellingItems.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Articles les plus vendus
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topSellingItems.slice(0, 6).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-muted rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {item.menuItem.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {item.quantitySold} vendus
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {item.revenue.toFixed(0)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

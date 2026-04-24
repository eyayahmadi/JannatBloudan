import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { InventoryTable } from '../components/InventoryTable';
import type { InventoryItem } from '../types';

export const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const restaurantId = 'demo-restaurant-id';

  useEffect(() => {
    loadInventory();
  }, [showLowStockOnly]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getInventory({
        restaurantId,
        lowStock: showLowStockOnly,
      });
      setItems(data.items);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    // Open edit modal
    console.log('Edit item:', item);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article?')) {
      return;
    }

    try {
      await adminApi.deleteInventoryItem(itemId);
      loadInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleRestock = async (item: InventoryItem) => {
    const quantity = prompt(`Quantité à ajouter (${item.unit}):`);
    if (!quantity) return;

    try {
      await adminApi.recordInventoryTransaction({
        itemId: item.id,
        transactionType: 'IN',
        quantity: Number(quantity),
        reason: 'Réapprovisionnement',
        performedBy: 'current-user-id',
      });
      loadInventory();
    } catch (error) {
      console.error('Error restocking item:', error);
    }
  };

  const lowStockCount = items.filter((item) => item.status === 'LOW_STOCK').length;
  const outOfStockCount = items.filter((item) => item.status === 'OUT_OF_STOCK').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestion des stocks
          </h1>
          <p className="text-muted-foreground">
            Gérez votre inventaire et les réapprovisionnements
          </p>
        </div>

        {/* Alerts */}
        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Alertes de stock
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {outOfStockCount > 0 && (
                    <span className="mr-4">
                      {outOfStockCount} article(s) en rupture de stock
                    </span>
                  )}
                  {lowStockCount > 0 && (
                    <span>{lowStockCount} article(s) avec stock bas</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showLowStockOnly
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Stocks bas uniquement
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            + Ajouter un article
          </button>
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <InventoryTable
            items={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestock={handleRestock}
          />
        )}
      </div>
    </div>
  );
};

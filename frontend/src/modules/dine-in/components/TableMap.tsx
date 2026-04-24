import React, { useState, useEffect } from 'react';
import { dineInApi } from '../services/dineInApi';
import type { Table, TableStatus } from '../types';

interface TableMapProps {
  restaurantId: string;
  selectedDate?: string;
  selectedTime?: string;
  onTableSelect?: (table: Table) => void;
}

const statusColors: Record<TableStatus, string> = {
  AVAILABLE: 'bg-green-500 hover:bg-green-600',
  OCCUPIED: 'bg-red-500 cursor-not-allowed',
  RESERVED: 'bg-yellow-500 cursor-not-allowed',
  MAINTENANCE: 'bg-gray-500 cursor-not-allowed',
};

const statusLabels: Record<TableStatus, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Occupée',
  RESERVED: 'Réservée',
  MAINTENANCE: 'Maintenance',
};

export const TableMap: React.FC<TableMapProps> = ({
  restaurantId,
  selectedDate,
  selectedTime,
  onTableSelect,
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  useEffect(() => {
    loadTables();
  }, [restaurantId, selectedDate, selectedTime]);

  const loadTables = async () => {
    try {
      setLoading(true);
      // Cette API devrait retourner toutes les tables avec leur statut actuel
      const response = await dineInApi.getAvailableTables({
        restaurantId,
        date: selectedDate || new Date().toISOString().split('T')[0],
        time: selectedTime || '19:00',
        partySize: 2,
      });
      setTables(response.availableTables);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (table: Table) => {
    if (table.status === 'AVAILABLE') {
      setSelectedTable(table);
      onTableSelect?.(table);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Grouper les tables par section
  const tablesBySection = tables.reduce((acc, table) => {
    const section = table.section || 'Principal';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Plan de salle</h3>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted rounded-lg">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${statusColors[status as TableStatus]}`} />
            <span className="text-sm text-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Tables par section */}
      <div className="space-y-6">
        {Object.entries(tablesBySection).map(([section, sectionTables]) => (
          <div key={section}>
            <h4 className="text-md font-medium text-foreground mb-3">{section}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sectionTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  disabled={table.status !== 'AVAILABLE'}
                  className={`
                    relative p-4 rounded-lg text-white font-semibold text-center
                    transition-all transform hover:scale-105
                    ${statusColors[table.status]}
                    ${selectedTable?.id === table.id ? 'ring-4 ring-primary' : ''}
                  `}
                >
                  <div className="text-lg mb-1">Table {table.tableNumber}</div>
                  <div className="text-xs opacity-90">
                    {table.capacity} {table.capacity === 1 ? 'pers.' : 'pers.'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Détails de la table sélectionnée */}
      {selectedTable && (
        <div className="mt-6 p-4 bg-primary/10 border border-primary rounded-lg">
          <h4 className="font-semibold text-foreground mb-2">
            Table {selectedTable.tableNumber} sélectionnée
          </h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Capacité: {selectedTable.capacity} personnes</p>
            <p>Section: {selectedTable.section}</p>
            <p>Étage: {selectedTable.floor}</p>
          </div>
        </div>
      )}
    </div>
  );
};

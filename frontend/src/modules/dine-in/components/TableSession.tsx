import React, { useState, useEffect } from 'react';
import { dineInApi } from '../services/dineInApi';
import type { TableSession as TableSessionType, Table } from '../types';

interface TableSessionProps {
  sessionId: string;
  onEndSession?: () => void;
}

export const TableSession: React.FC<TableSessionProps> = ({
  sessionId,
  onEndSession,
}) => {
  const [session, setSession] = useState<TableSessionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [transferReason, setTransferReason] = useState('');

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await dineInApi.getSession(sessionId);
      setSession(data);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferTable = async () => {
    if (!selectedTable || !transferReason) return;

    try {
      setTransferring(true);
      await dineInApi.transferTable(sessionId, {
        toTableId: selectedTable,
        reason: transferReason,
      });
      setShowTransferModal(false);
      loadSession();
    } catch (error) {
      console.error('Error transferring table:', error);
    } finally {
      setTransferring(false);
    }
  };

  const handleRequestBill = async () => {
    try {
      await dineInApi.requestBill(sessionId);
      alert('Demande d\'addition envoyée');
    } catch (error) {
      console.error('Error requesting bill:', error);
    }
  };

  const handlePayment = async (method: 'CARD' | 'CASH') => {
    try {
      await dineInApi.payBill(sessionId, {
        paymentMethod: method,
        tipAmount: 0,
      });
      alert('Paiement effectué avec succès');
      onEndSession?.();
    } catch (error) {
      console.error('Error processing payment:', error);
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

  if (!session) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Session non trouvée</p>
      </div>
    );
  }

  const duration = session.startedAt
    ? Math.floor(
        (new Date().getTime() - new Date(session.startedAt).getTime()) / 60000
      )
    : 0;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-primary text-primary-foreground">
        <h2 className="text-xl font-bold mb-1">
          Table {session.table.tableNumber}
        </h2>
        <p className="text-sm opacity-90">
          {session.customerCount} {session.customerCount === 1 ? 'personne' : 'personnes'}
        </p>
      </div>

      {/* Session Info */}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Durée</span>
          <span className="text-lg font-semibold text-foreground">
            {duration} min
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Section</span>
          <span className="text-foreground">{session.table.section}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Capacité</span>
          <span className="text-foreground">{session.table.capacity} pers.</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Statut</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              session.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {session.status === 'ACTIVE' ? 'Active' : 'Terminée'}
          </span>
        </div>
      </div>

      {/* Actions */}
      {session.status === 'ACTIVE' && (
        <div className="px-6 py-4 border-t border-border space-y-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="w-full py-2 px-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
          >
            Changer de table
          </button>

          <button
            onClick={handleRequestBill}
            className="w-full py-2 px-4 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/80 transition-colors"
          >
            Demander l'addition
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePayment('CARD')}
              className="py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Payer par carte
            </button>
            <button
              onClick={() => handlePayment('CASH')}
              className="py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Payer en espèces
            </button>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Changer de table
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nouvelle table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sélectionner une table</option>
                  {availableTables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.tableNumber} ({table.capacity} pers.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Raison du changement
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Ex: Demande du client, table plus grande..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleTransferTable}
                  disabled={!selectedTable || !transferReason || transferring}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {transferring ? 'Transfert...' : 'Confirmer'}
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-6 py-2 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { MemorizationList } from './MemorizationList';
import { AddMemorizationForm } from './AddMemorizationForm';

export function MemorizationContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">History</h2>
          <p className="text-sm text-muted-foreground">Recent memorization records by student and teacher.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-medium text-white shadow-md shadow-teal-600/20 transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:bg-teal-500 dark:hover:bg-teal-600"
        >
          <Plus className="h-4 w-4" />
          Record memorization
        </button>
      </div>

      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-teal-200/50 bg-card shadow-2xl dark:border-teal-800/30">
            <div className="border-b border-border bg-gradient-to-r from-teal-50/80 to-transparent px-6 py-4 dark:from-teal-950/30">
              <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100">Record memorization</h3>
              <p className="text-sm text-muted-foreground">Sabaq (new) or Muraja&apos;a (revision)</p>
            </div>
            <div className="p-6">
              <AddMemorizationForm
                onSuccess={handleSuccess}
                onClose={() => setModalOpen(false)}
              />
            </div>
          </div>
        </>
      )}

      <MemorizationList key={refreshKey} />
    </div>
  );
}

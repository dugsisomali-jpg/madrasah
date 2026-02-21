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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">History</h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Record memorization
        </button>
      </div>

      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-6 shadow-xl">
            <AddMemorizationForm
              onSuccess={handleSuccess}
              onClose={() => setModalOpen(false)}
            />
          </div>
        </>
      )}

      <MemorizationList key={refreshKey} />
    </div>
  );
}

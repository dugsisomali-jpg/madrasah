'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ExamsList } from './ExamsList';
import { AddExamForm } from './AddExamForm';

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted';

export function ExamsContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Results</h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={btnPrimary}
        >
          <Plus className="h-4 w-4" />
          Add exam result
        </button>
      </div>
      <ExamsList key={refreshKey} />
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AddExamForm
              onSuccess={() => {
                setModalOpen(false);
                setRefreshKey((k) => k + 1);
              }}
              onCancel={() => setModalOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}

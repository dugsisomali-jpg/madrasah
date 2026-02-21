'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ExamsList } from './ExamsList';
import { AddExamForm } from './AddExamForm';

export function ExamsContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Results by subject</h2>
          <p className="text-sm text-muted-foreground">Filter by student, parent, teacher, or subject.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-md shadow-indigo-600/20 transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Add exam result
        </button>
      </div>

      <ExamsList key={refreshKey} />

      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-indigo-200/50 bg-card shadow-2xl dark:border-indigo-800/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border bg-gradient-to-r from-indigo-50/80 to-transparent px-6 py-4 dark:from-indigo-950/30">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Add exam result</h3>
              <p className="text-sm text-muted-foreground">Select subject, student, and enter marks.</p>
            </div>
            <div className="p-6">
              <AddExamForm
                onSuccess={() => {
                  setModalOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
                onCancel={() => setModalOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { FileCheck } from 'lucide-react';
import { ExamsContent } from './ExamsContent';

export default function ExamsPage() {
  return (
    <div className="space-y-8">
      {/* Subject-based hero: Exam Results by Subject */}
      <div className="overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-violet-50/80 to-indigo-50 dark:border-indigo-800/50 dark:from-indigo-950/40 dark:via-violet-950/20 dark:to-indigo-950/40">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 dark:bg-indigo-500">
              <FileCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100 sm:text-3xl">
                Exam Results
              </h1>
              <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">
                By subject — record and filter results by student, subject, and term.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ExamsContent />
    </div>
  );
}

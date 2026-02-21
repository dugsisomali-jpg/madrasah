import { BookOpen } from 'lucide-react';
import { MemorizationContent } from './MemorizationContent';

export default function MemorizationPage() {
  return (
    <div className="space-y-8">
      {/* Subject-based hero: Qur'an Memorization */}
      <div className="overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 via-emerald-50/80 to-teal-50 dark:border-teal-800/50 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-teal-950/40">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25 dark:bg-teal-500">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-teal-900 dark:text-teal-100 sm:text-3xl">
                Qur&apos;an Memorization
              </h1>
              <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
                Track Sabaq (new) and Muraja&apos;a (revision) by surah and ayah.
              </p>
            </div>
          </div>
        </div>
      </div>

      <MemorizationContent />
    </div>
  );
}

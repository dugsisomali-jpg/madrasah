import { Banknote, Calendar } from 'lucide-react';
import { PaymentsContent } from './PaymentsContent';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100/80 p-6 dark:border-slate-700/50 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-slate-100">Payments</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0 text-sm text-muted-foreground">
              Fee periods, receipts, and balances. Set a <span className="inline-flex items-center gap-1 font-medium text-foreground/90"><Calendar className="h-3.5 w-3.5" /> due date</span> for any remaining balance from the table or the payment detail page.
            </p>
          </div>
        </div>
      </div>
      <PaymentsContent />
    </div>
  );
}

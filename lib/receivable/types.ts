/**
 * Receivable module types.
 * Receivables are derived from Payment (fee) and Receipt data — no separate table.
 */

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface ReceivableSummary {
  paymentId: string;
  studentId: string;
  studentName: string;
  month: number;
  year: number;
  totalAmount: number;
  totalPaid: number;
  discount: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  isOverdue: boolean;
  dueDate: string; // ISO date (last day of month)
  daysOverdue: number; // 0 if not overdue
}

export interface ReceivableListItem extends ReceivableSummary {
  academicMonthKey: string; // e.g. "2024-3"
}

export interface StudentReceivableView {
  studentId: string;
  studentName: string;
  totalOutstanding: number;
  receivables: ReceivableSummary[];
  paymentHistory: Array<{
    paymentId: string;
    month: number;
    year: number;
    totalAmount: number;
    totalPaid: number;
    remainingBalance: number;
    status: PaymentStatus;
    receipts: Array<{ id: string; amount: number; date: string; receiptNumber?: string | null }>;
  }>;
}

export interface ReceivableDashboardMetrics {
  totalOutstandingBalance: number;
  totalOverdueAmount: number;
  unpaidStudentsCount: number;
  monthlyTrend: Array<{ month: number; year: number; outstanding: number; overdue: number }>;
  aging: {
    bucket0To30: number;
    bucket31To60: number;
    bucket61Plus: number;
  };
}

export interface AgingAnalysis {
  bucket0To30: number;
  bucket31To60: number;
  bucket61Plus: number;
  details: Array<{ paymentId: string; studentName: string; month: number; year: number; amount: number; daysOverdue: number }>;
}

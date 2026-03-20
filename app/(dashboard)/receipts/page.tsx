'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  Search, 
  Calendar, 
  User, 
  ChevronRight, 
  Loader2, 
  FileText,
  Filter,
  ArrowRight,
  Printer
} from 'lucide-react';

type ReceiptBatch = {
  id: string;
  receiptNumber?: string;
  totalAmount: string;
  date: string;
  notes?: string;
  Parent?: { name: string; username: string };
  Student?: { name: string };
  _count: { receipts: number };
};

export default function ReceiptsPage() {
  const [batches, setBatches] = useState<ReceiptBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receipts/batches?page=${page}&search=${search}`);
      const data = await res.json();
      if (data.batches) {
        setBatches(data.batches);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBatches();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                <Receipt className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Receipts History</h1>
            </div>
            <p className="text-slate-500 font-medium ml-1">View and print all past payment confirmations.</p>
          </div>

          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="Search by receipt #, parent or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium shadow-sm transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        {loading && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest">Searching Archives...</span>
          </div>
        ) : batches.length === 0 ? (
          <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 py-24 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">No receipts found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">Try adjusting your search query or check back after making a payment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {batches.map((batch) => (
              <Link 
                key={batch.id}
                href={`/receipts/${batch.id}`}
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 active:scale-[0.99]"
              >
                <div className="flex items-start gap-6">
                  <div className="mt-1 h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <Printer className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        {batch.receiptNumber ? `Receipt #${batch.receiptNumber}` : `Batch #${batch.id.slice(-6).toUpperCase()}`}
                      </span>
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600 uppercase tracking-wider italic">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        Settled
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary transition-colors">
                      {batch.Parent?.name || batch.Student?.name || 'Valued Parent'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-sm font-bold text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(batch.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {batch._count.receipts === 1 ? 'Single Receipt' : `${batch._count.receipts} Combined Receipts`}
                      </div>
                    </div>
                    {batch.notes && (
                      <p className="mt-3 text-xs font-medium text-slate-400 italic bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-50">
                        "{batch.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-10 pl-16 md:pl-0">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Paid</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900 tracking-tighter decoration-slate-200 underline-offset-4 group-hover:underline">
                        {Number(batch.totalAmount).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KES</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all rotate-0 group-hover:-rotate-45">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] text-slate-400">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 hover:bg-slate-50 disabled:opacity-30 transition-all font-black text-slate-900 text-xs"
                >
                  Prior
                </button>
                <div className="bg-slate-900/5 px-4 py-2 rounded-lg font-black text-slate-900">
                  Archive {page} OF {totalPages}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 hover:bg-slate-50 disabled:opacity-30 transition-all font-black text-slate-900 text-xs"
                >
                  Forward
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

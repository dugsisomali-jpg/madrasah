'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Calendar,
  Filter,
  DollarSign,
  Briefcase,
  History,
  Download,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Summary = {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
};

type Breakdown = {
  expenses: Record<string, number>;
  income: Record<string, number>;
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
};

type ReportData = {
  summary: Summary;
  breakdown: Breakdown;
  transactions: Transaction[];
};

export default function FinanceReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '' });

  const fetchData = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filters.from) qs.set('from', filters.from);
    if (filters.to) qs.set('to', filters.to);

    try {
      const res = await fetch(`/api/reports/finance?${qs.toString()}`);
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  if (loading && !data) {
    return (
      <div className="flex h-[calc(100vh-160px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const { summary, breakdown, transactions } = data || { 
    summary: { totalIncome: 0, totalExpenses: 0, netProfit: 0 }, 
    breakdown: { expenses: {}, income: {} },
    transactions: []
  };

  const expenseTotal = Object.values(breakdown.expenses).reduce((a, b) => a + b, 0);

  const exportToCSV = () => {
    if (!data) return;
    const { summary, breakdown } = data;
    
    let csv = "FINANCIAL REPORT\n";
    csv += `Period: ${filters.from || 'All Time'} to ${filters.to || 'Present'}\n\n`;
    csv += "Summary (KES)\n";
    csv += `Total Income,${summary.totalIncome}\n`;
    csv += `Total Expenses,${summary.totalExpenses}\n`;
    csv += `Net Balance,${summary.netProfit}\n\n`;

    csv += "Expense Breakdown\n";
    csv += "Category,Amount (KES),Percentage\n";
    Object.entries(breakdown.expenses).forEach(([cat, amt]) => {
      const pct = expenseTotal > 0 ? (amt / expenseTotal * 100).toFixed(1) : 0;
      csv += `${cat},${amt},${pct}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Financial Report</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Income & Expense Analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input 
                type="date" 
                value={filters.from}
                onChange={e => setFilters(prev => ({ ...prev, from: e.target.value }))}
                className="text-[11px] font-black uppercase text-slate-600 outline-none"
              />
              <span className="text-slate-300 mx-1">-</span>
              <input 
                type="date" 
                value={filters.to}
                onChange={e => setFilters(prev => ({ ...prev, to: e.target.value }))}
                className="text-[11px] font-black uppercase text-slate-600 outline-none"
              />
           </div>
           <button 
             onClick={exportToCSV}
             className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95"
           >
              <Download className="h-5 w-5" />
           </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                 <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-md">Total Income</span>
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                 <span className="text-xs font-bold text-slate-300 mr-2">KES</span>
                 {summary.totalIncome.toLocaleString()}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Revenue from all cycles</p>
           </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
                 <TrendingDown className="h-5 w-5 text-rose-600" />
              </div>
              <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-1 rounded-md">Total Expenses</span>
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                 <span className="text-xs font-bold text-slate-300 mr-2">KES</span>
                 {summary.totalExpenses.toLocaleString()}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Inclusive of staff payroll</p>
           </div>
        </div>

        {/* Net Balance Card */}
        <div className={cn(
          "p-6 rounded-2xl border shadow-lg shadow-indigo-600/10",
          summary.netProfit >= 0 ? "bg-indigo-600 border-indigo-700 text-white" : "bg-slate-900 border-slate-900 text-white"
        )}>
           <div className="flex justify-between items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                 <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase bg-white/10 px-2 py-1 rounded-md">Net Balance</span>
           </div>
           <div>
              <h2 className="text-3xl font-black tracking-tight">
                 <span className="text-xs font-bold text-white/40 mr-2">KES</span>
                 {summary.netProfit.toLocaleString()}
              </h2>
              <p className="text-[10px] font-bold text-white/40 uppercase mt-2">Consolidated Profit/Loss</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed Transactions Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <List className="h-5 w-5 text-indigo-500" />
                 <h3 className="text-sm font-black text-slate-900 uppercase">Recent Transactions</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{transactions.length} Records</span>
           </div>
           
           <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50">
                       <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                       <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                       <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                       <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-xs font-bold text-slate-300 uppercase italic">No activity recorded</td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString('en-GB')}
                           </td>
                           <td className="px-6 py-4">
                              <p className="text-[11px] font-black text-slate-900 uppercase leading-none">{tx.description}</p>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                 {tx.category}
                              </span>
                           </td>
                           <td className={cn(
                             "px-6 py-4 text-right text-xs font-black",
                             tx.type === 'INCOME' ? "text-emerald-600" : "text-rose-600"
                           )}>
                              {tx.type === 'INCOME' ? '+' : '-'} {tx.amount.toLocaleString()}
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Expense Breakdown Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
           <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase">Expense Analysis</h3>
           </div>
           
           <div className="space-y-6">
              {Object.entries(breakdown.expenses).length === 0 ? (
                <p className="py-10 text-center text-[10px] font-black text-slate-300 uppercase italic">No breakdown data</p>
              ) : (
                Object.entries(breakdown.expenses).sort((a,b) => b[1] - a[1]).map(([cat, amount]) => {
                  const pct = expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-2">
                       <div className="flex justify-between items-end">
                          <p className="text-[10px] font-black text-slate-600 uppercase">{cat}</p>
                          <p className="text-xs font-black text-slate-900">KES {amount.toLocaleString()}</p>
                       </div>
                       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <div className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            cat === 'Payroll' ? "bg-indigo-600" : "bg-slate-400"
                          )} style={{ width: `${pct}%` }} />
                       </div>
                    </div>
                  );
                })
              )}
           </div>

           <div className="pt-6 border-t border-slate-50">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Accounting Standard</p>
                 <p className="text-[11px] font-bold text-slate-900">Cash-Based Methodology</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

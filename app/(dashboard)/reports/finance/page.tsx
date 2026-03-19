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
  Download
} from 'lucide-react';

type Summary = {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
};

type Breakdown = {
  expenses: Record<string, number>;
  income: Record<string, number>;
};

type ReportData = {
  summary: Summary;
  breakdown: Breakdown;
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
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-slate-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { summary, breakdown } = data || { 
    summary: { totalIncome: 0, totalExpenses: 0, netProfit: 0 }, 
    breakdown: { expenses: {}, income: {} } 
  };

  const expenseTotal = Object.values(breakdown.expenses).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/10">
            <PieChart className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Financial Intelligence</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Audit & Analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 italic">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input 
                type="date" 
                value={filters.from}
                onChange={e => setFilters(prev => ({ ...prev, from: e.target.value }))}
                className="text-xs font-black uppercase text-slate-600 outline-none"
              />
              <span className="text-slate-300 mx-1">/</span>
              <input 
                type="date" 
                value={filters.to}
                onChange={e => setFilters(prev => ({ ...prev, to: e.target.value }))}
                className="text-xs font-black uppercase text-slate-600 outline-none"
              />
           </div>
           <button className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm transition-all active:scale-95">
              <Download className="h-5 w-5" />
           </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Total Income Card */}
        <div className="group bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
           <div className="relative space-y-4">
              <div className="flex justify-between items-center">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                 </div>
                 <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Income</span>
                 </div>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Total Revenue</p>
                 <h2 className="text-4xl font-black text-slate-900 leading-none tracking-tighter">
                    <span className="text-sm font-bold text-slate-300 mr-2">KES</span>
                    {summary.totalIncome.toLocaleString()}
                 </h2>
              </div>
           </div>
        </div>

        {/* Total Expenses Card */}
        <div className="group bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
           <div className="relative space-y-4">
              <div className="flex justify-between items-center">
                 <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-rose-500" />
                 </div>
                 <div className="px-3 py-1 bg-rose-50 rounded-full border border-rose-100 flex items-center gap-1">
                    <ArrowDownRight className="h-3 w-3 text-rose-600" />
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">Expense</span>
                 </div>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Total Expenditures</p>
                 <h2 className="text-4xl font-black text-slate-900 leading-none tracking-tighter">
                    <span className="text-sm font-bold text-slate-300 mr-2">KES</span>
                    {summary.totalExpenses.toLocaleString()}
                 </h2>
              </div>
           </div>
        </div>

        {/* Net Profit Card */}
        <div className={`group p-10 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden ${summary.netProfit >= 0 ? 'bg-indigo-600 border-indigo-700' : 'bg-slate-900 border-slate-900'}`}>
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
           <div className="relative space-y-4">
              <div className="flex justify-between items-center">
                 <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                    <DollarSign className="h-6 w-6" />
                 </div>
                 <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-white">
                    <span className="text-[10px] font-black uppercase tracking-tighter">Net Profit</span>
                 </div>
              </div>
              <div>
                 <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5">Consolidated Balance</p>
                 <h2 className="text-4xl font-black text-white leading-none tracking-tighter">
                    <span className="text-sm font-bold text-white/40 mr-2">KES</span>
                    {summary.netProfit.toLocaleString()}
                 </h2>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Expenses Breakdown */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div className="flex items-center gap-3">
                 <Briefcase className="h-5 w-5 text-indigo-500" />
                 <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Expense Categories</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{Object.keys(breakdown.expenses).length} Groups</p>
           </div>
           
           <div className="space-y-6">
              {Object.entries(breakdown.expenses).length === 0 ? (
                <p className="py-10 text-center text-xs font-bold text-slate-300 uppercase tracking-widest">No data available for this range</p>
              ) : (
                Object.entries(breakdown.expenses).sort((a,b) => b[1] - a[1]).map(([cat, amount]) => {
                  const pct = expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-2">
                       <div className="flex justify-between items-end px-1">
                          <p className="text-[11px] font-black text-slate-700 uppercase leading-none tracking-tight">{cat}</p>
                          <div className="text-right leading-none">
                             <p className="text-sm font-black text-slate-900">KES {amount.toLocaleString()}</p>
                             <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{pct.toFixed(1)}% of total</p>
                          </div>
                       </div>
                       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${cat === 'Payroll' ? 'bg-indigo-500' : 'bg-slate-900'}`} style={{ width: `${pct}%` }} />
                       </div>
                    </div>
                  );
                })
              )}
           </div>
        </div>

        {/* Recent Financial Activity / Tips */}
        <div className="flex flex-col gap-10">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 flex-1">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                 <History className="h-5 w-5 text-indigo-500" />
                 <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Institutional Performance</h3>
              </div>
              <div className="space-y-6">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-colors">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Profit Margin Analysis</p>
                    {summary.totalIncome > 0 ? (
                       <div className="flex items-end gap-3">
                          <h4 className="text-4xl font-black text-slate-900 leading-none">
                             {((summary.netProfit / summary.totalIncome) * 100).toFixed(1)}%
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Efficiency Ratio</p>
                       </div>
                    ) : (
                       <p className="text-sm font-bold text-slate-300">Insufficient Data</p>
                    )}
                 </div>

                 <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center">
                       <ArrowUpRight className="h-5 w-5 text-indigo-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                       Financial reports are compiled based on confirmed receipts and recorded expenses. Data synchronization occurs in real-time.
                    </p>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                 <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest italic mb-1">Forecasting available soon</p>
                 <h4 className="text-sm font-black text-white uppercase leading-tight tracking-tight">AI-Enhanced Financial<br />Projections are in beta</h4>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

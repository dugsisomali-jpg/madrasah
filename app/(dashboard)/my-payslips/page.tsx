'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Loader2,
  CheckCircle2,
  Lock
} from 'lucide-react';

type Payslip = {
  id: string;
  grossEarnings: string;
  totalDeductions: string;
  netSalary: string;
  status: string;
  createdAt: string;
  payrollRun: { month: number; year: number; status: string };
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/my-payslips');
      const data = await res.json();
      setPayslips(Array.isArray(data) ? data : []);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayslips(); }, []);

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen bg-slate-50/50 italic-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/10">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">My Payslips</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Personal Earnings & Payroll History</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-4">
           <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse font-sans">Connecting to Financial Ledger...</p>
        </div>
      ) : payslips.length === 0 ? (
        <div className="py-40 text-center opacity-30">
           <FileText className="h-16 w-16 mx-auto text-slate-900 mb-6" />
           <p className="text-sm font-black text-slate-900 uppercase tracking-widest">No payslip records found for your account</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {payslips.map(ps => (
              <div key={ps.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-indigo-900/5 transition-all group">
                 <div className="p-10 space-y-8">
                    {/* Top Row: Period & Status */}
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Payroll Cycle</p>
                          <h2 className="text-2xl font-black text-slate-900 uppercase italic-none">
                             {MONTHS[ps.payrollRun.month - 1]} {ps.payrollRun.year}
                          </h2>
                       </div>
                       <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                          ps.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                       }`}>
                          {ps.status === 'PAID' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          {ps.status}
                       </span>
                    </div>

                    {/* Middle Row: Financial Breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100/50">
                          <div className="flex items-center gap-2 text-emerald-600 mb-2">
                             <TrendingUp className="h-4 w-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Gross</span>
                          </div>
                          <p className="text-xl font-black text-slate-900">${ps.grossEarnings}</p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100/50">
                          <div className="flex items-center gap-2 text-rose-600 mb-2">
                             <TrendingDown className="h-4 w-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Deductions</span>
                          </div>
                          <p className="text-xl font-black text-slate-900">${ps.totalDeductions}</p>
                       </div>
                    </div>

                    {/* Bottom Row: Net Salary */}
                    <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Payable</p>
                          <p className="text-3xl font-black text-indigo-600 tracking-tighter">${ps.netSalary}</p>
                       </div>
                       <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300">
                          <Download className="h-4 w-4" />
                          Download PDF
                       </button>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
}

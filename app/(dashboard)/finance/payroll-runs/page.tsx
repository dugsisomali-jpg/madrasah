'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Banknote, 
  Calendar, 
  CheckCircle2, 
  Lock, 
  MoreHorizontal, 
  Plus, 
  FileText, 
  Eye, 
  AlertCircle,
  Loader2,
  XCircle,
  Send,
  Zap,
  Search
} from 'lucide-react';
import Swal from 'sweetalert2';

type PayrollRun = {
  id: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'APPROVED' | 'LOCKED';
  createdAt: string;
  approvedBy?: string;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newRun, setNewRun] = useState({
     month: new Date().getMonth() + 1,
     year: new Date().getFullYear()
  });

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll-runs');
      const data = await res.json();
      setRuns(data);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRuns(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payroll-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRun),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      setShowNewModal(false);
      fetchRuns();
      Swal.fire('Success', 'Payroll run generated in DRAFT mode.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen bg-slate-50/50 italic-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/10">
            <Banknote className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Payroll Engine</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Financial Liquidity</p>
          </div>
        </div>

        <button 
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
        >
          <Zap className="h-4 w-4 text-amber-400" />
          Initialize Payroll Run
        </button>
      </div>

      {/* Grid of Runs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {loading ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
               <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse font-sans">Accessing Payroll Vault...</p>
            </div>
         ) : runs.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-40">
               <Calendar className="h-12 w-12 mx-auto text-slate-900 mb-4" />
               <p className="text-sm font-black text-slate-900 uppercase">No payroll history found</p>
            </div>
         ) : (
            runs.map(run => (
               <div key={run.id} className="relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                     <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        run.status === 'LOCKED' ? 'bg-slate-900 text-white border-slate-800' :
                        run.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                     }`}>
                        {run.status === 'LOCKED' && <Lock className="h-3 w-3" />}
                        {run.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
                        {run.status === 'DRAFT' && <FileText className="h-3 w-3" />}
                        {run.status}
                     </span>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Payroll Cycle</p>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic-none">
                           {MONTHS[run.month - 1]} {run.year}
                        </h2>
                     </div>

                     <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex -space-x-3">
                           {/* Placeholder for staff icons or count */}
                           <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                             HP
                           </div>
                           <div className="h-8 w-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-400">
                             +12
                           </div>
                        </div>
                        <Link 
                          href={`/finance/payroll-runs/${run.id}`}
                          className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                           <Search className="h-4 w-4 text-slate-400 group-hover:text-white" />
                           Manage Run
                        </Link>
                     </div>
                  </div>

                  {/* Aesthetic BG element */}
                  <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
               </div>
            ))
         )}
      </div>

      {/* New Run Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
              <div className="p-10 space-y-10">
                 <div className="flex justify-between items-start">
                    <div className="flex gap-5">
                       <div className="h-14 w-14 rounded-[1.5rem] bg-amber-50 flex items-center justify-center">
                          <Zap className="h-7 w-7 text-amber-500" />
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none mb-2">Initialize Run</h2>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generate Automated Payslips</p>
                       </div>
                    </div>
                    <button onClick={() => setShowNewModal(false)} className="text-slate-300 hover:text-slate-900">
                       <XCircle className="h-8 w-8" />
                    </button>
                 </div>

                 <form onSubmit={handleCreate} className="space-y-8">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Select Payment Period</label>
                          <div className="grid grid-cols-2 gap-4">
                             <select 
                               value={newRun.month}
                               onChange={e => setNewRun(p => ({ ...p, month: parseInt(e.target.value) }))}
                               className="bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all"
                             >
                                {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                             </select>
                             <input 
                               type="number" 
                               value={newRun.year}
                               onChange={e => setNewRun(p => ({ ...p, year: parseInt(e.target.value) }))}
                               className="bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all"
                             />
                          </div>
                       </div>

                       <div className="flex items-start gap-3 bg-amber-50 p-6 rounded-[1.5rem] border border-amber-100/50">
                          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-wider">
                             This will compute earnings and deductions for all currently <strong>ACTIVE</strong> employees based on their assigned salary templates. Draft records will be generated for your review.
                          </p>
                       </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-slate-900 px-8 py-5 rounded-[2rem] text-xs font-black text-white uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-2xl active:scale-95"
                    >
                       Generate Monthly Payroll
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

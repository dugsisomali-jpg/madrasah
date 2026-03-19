'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Banknote, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import Swal from 'sweetalert2';

type Teacher = {
  id: string;
  name: string;
  username: string;
  salary: number | null;
};

type PayrollRecord = {
  id: string;
  userId: string;
  amount: number;
  month: number;
  year: number;
  paymentDate: string;
  notes: string | null;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayrollPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payrollState, setPayrollState] = useState<Record<string, PayrollRecord>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/users/teachers'),
        fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`)
      ]);
      const tData = await tRes.json();
      const pData = await pRes.json();
      
      setTeachers(tData);
      
      const pMap: Record<string, PayrollRecord> = {};
      if (Array.isArray(pData)) {
        pData.forEach(r => { pMap[r.userId] = r; });
      }
      setPayrollState(pMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !paymentAmount) return;

    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedTeacher.id,
          amount: parseFloat(paymentAmount),
          month: selectedMonth,
          year: selectedYear,
          paymentDate: new Date().toISOString().split('T')[0],
          notes: paymentNotes
        }),
      });

      if (!res.ok) throw new Error('Failed to record');
      
      setSelectedTeacher(null);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchData();

      Swal.fire({
        icon: 'success',
        title: 'Payment Recorded',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to record payroll' });
    }
  };

  const totalPayroll = Object.values(payrollState).reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/10">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Staff Payroll</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Salary Disbursements & Tracking</p>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
           <button 
             onClick={() => setSelectedMonth(prev => prev === 1 ? 12 : prev - 1)}
             className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
           >
              <ChevronLeft className="h-5 w-5 text-slate-400" />
           </button>
           <div className="px-4 text-center min-w-[150px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{selectedYear}</p>
              <p className="text-sm font-black text-slate-900 uppercase">{MONTHS[selectedMonth - 1]}</p>
           </div>
           <button 
             onClick={() => setSelectedMonth(prev => prev === 12 ? 1 : prev + 1)}
             className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
           >
              <ChevronRight className="h-5 w-5 text-slate-400" />
           </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
               <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Monthly Disbursements</p>
               <h2 className="text-3xl font-black text-slate-900 leading-none">KES {totalPayroll.toLocaleString()}</h2>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
               <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Staff Count</p>
               <h2 className="text-3xl font-black text-slate-900 leading-none">{teachers.length} Active</h2>
            </div>
         </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher / Staff</th>
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Target Salary</th>
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount Paid</th>
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                   <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Syncing Payroll Data...</p>
                   </div>
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-slate-400 uppercase font-black text-xs">No teachers found.</td>
              </tr>
            ) : (
              teachers.map((t) => {
                const record = payrollState[t.id];
                const isPaid = !!record;
                const baseSalary = t.salary ? Number(t.salary) : 0;
                
                return (
                  <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-8">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase">
                             {t.name?.charAt(0) || t.username.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900 leading-none mb-1 uppercase">{t.name || t.username}</p>
                             <p className="text-[10px] font-bold text-slate-400 leading-none">@{t.username}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                       <p className="text-sm font-bold text-slate-400">
                          {baseSalary > 0 ? `KES ${baseSalary.toLocaleString()}` : '—'}
                       </p>
                    </td>
                    <td className="py-6 px-8 text-right">
                       <p className={`text-lg font-black ${isPaid ? 'text-slate-900' : 'text-slate-200'}`}>
                          {isPaid ? `KES ${record.amount.toLocaleString()}` : '—'}
                       </p>
                    </td>
                    <td className="py-6 px-8 text-center">
                       {isPaid ? (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Paid</span>
                         </div>
                       ) : (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Unpaid</span>
                         </div>
                       )}
                    </td>
                    <td className="py-6 px-8 text-center">
                       <button 
                         onClick={() => {
                           setSelectedTeacher(t);
                           setPaymentAmount(t.salary?.toString() || '');
                         }}
                         className="p-3 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                       >
                          <CreditCard className="h-5 w-5" />
                       </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                   <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                         <Banknote className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase leading-none mb-2">Record Salary</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Disbursement for {MONTHS[selectedMonth - 1]}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedTeacher(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                      <XCircle className="h-6 w-6" />
                   </button>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payee Identification</p>
                   <div className="flex justify-between items-end">
                      <p className="text-lg font-black text-slate-900 uppercase">{selectedTeacher.name || selectedTeacher.username}</p>
                      <p className="text-xs font-bold text-slate-500 font-mono">ID: {selectedTeacher.id.slice(-8).toUpperCase()}</p>
                   </div>
                </div>

                <form onSubmit={handleRecordPayment} className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Amount to Pay (KES)</label>
                       <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">KES</span>
                          <input 
                            required
                            type="number" 
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/30 pl-16 pr-6 py-4 text-xl font-black text-emerald-600 outline-none focus:border-primary transition-all"
                            placeholder="0.00"
                          />
                       </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Notes / Reference</label>
                      <textarea 
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm outline-none focus:border-primary transition-all resize-none"
                        placeholder="Internal notes about this disbursement..."
                        rows={2}
                      />
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setSelectedTeacher(null)}
                        className="flex-1 rounded-2xl border-2 border-slate-100 px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-[2] rounded-2xl bg-slate-900 px-4 py-4 text-xs font-black text-white shadow-xl hover:bg-slate-800 active:scale-95 transition-all uppercase tracking-widest"
                      >
                         Confirm Disbursement
                      </button>
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Banknote, 
  ChevronLeft, 
  Plus, 
  Search, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  XCircle,
  FileText,
  User,
  Zap
} from 'lucide-react';
import Swal from 'sweetalert2';

type Payslip = {
  id: string;
  grossEarnings: string;
  totalDeductions: string;
  netSalary: string;
  status: string;
  employee: { id: string; name: string; jobRole: string; department: string };
};

type Employee = {
  id: string;
  name: string;
  jobRole: string;
  department: string;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([
        fetch(`/api/payroll-runs/${id}/payslips`),
        fetch('/api/employees')
      ]);
      setPayslips(await pRes.json());
      setAllEmployees(await eRes.json());
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  const handleAddEmployee = async (employeeId: string) => {
    try {
      const res = await fetch(`/api/payroll-runs/${id}/payslips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (!res.ok) throw new Error('Failed');
      
      fetchDetails();
      Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Employee added to run',
          showConfirmButton: false,
          timer: 2000
      });
    } catch (err) {
      Swal.fire('Error', 'Failed to add employee', 'error');
    }
  };

  const handleDeletePayslip = async (payslipId: string) => {
    const confirm = await Swal.fire({
      title: 'Remove Payslip?',
      text: "This employee will be removed from this payroll run.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      confirmButtonColor: '#e11d48'
    });

    if (confirm.isConfirmed) {
      try {
        await fetch(`/api/payslips/${payslipId}`, { method: 'DELETE' });
        fetchDetails();
      } catch (err) {}
    }
  };

  const employeesNotInRun = allEmployees.filter(emp => 
    !payslips.some(ps => ps.employee.id === emp.id) &&
    (emp.name.toLowerCase().includes(search.toLowerCase()) || emp.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen bg-slate-50/50 italic-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Run Management</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
               <Zap className="h-3 w-3 text-amber-500" />
               Manual Processing Environment
            </p>
          </div>
        </div>

        <button 
          onClick={() => setAddingEmployee(true)}
          className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Onboard Employee to Run
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         {/* Main List */}
         <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <FileText className="h-4 w-4" />
                   Generated Payslips ({payslips.length})
                </h2>
            </div>

            {loading ? (
               <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
               </div>
            ) : payslips.length === 0 ? (
               <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100 flex flex-col items-center opacity-40">
                  <Banknote className="h-12 w-12 mb-4 text-slate-900" />
                  <p className="text-sm font-black text-slate-900 uppercase">Run is currently empty</p>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-2">Add employees manually to begin processing</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-4">
                  {payslips.map(ps => (
                     <div key={ps.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors capitalize text-xl font-black">
                              {ps.employee.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{ps.employee.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md uppercase">{ps.employee.jobRole}</span>
                                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">${ps.netSalary} NET</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <button className="p-3 text-slate-200 hover:text-indigo-600 transition-colors">
                              <Search className="h-5 w-5" />
                           </button>
                           <button onClick={() => handleDeletePayslip(ps.id)} className="p-3 text-slate-200 hover:text-rose-600 transition-colors">
                              <Trash2 className="h-5 w-5" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>

         {/* Sidebar: Add Employee */}
         {addingEmployee && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
               <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <UserPlus className="h-4 w-4" />
                     Available Personnel
                  </h2>
                  <button onClick={() => setAddingEmployee(false)} className="text-slate-300 hover:text-slate-900">
                     <XCircle className="h-6 w-6" />
                  </button>
               </div>

               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Search name or dept..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 ring-indigo-600/20 outline-none transition-all"
                  />
               </div>

               <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {employeesNotInRun.map(emp => (
                     <button 
                       key={emp.id}
                       onClick={() => handleAddEmployee(emp.id)}
                       className="w-full bg-white p-5 rounded-2xl border border-slate-50 flex items-center justify-between hover:bg-indigo-600 hover:text-white group transition-all"
                     >
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-white/10 group-hover:text-white uppercase transition-colors">
                              {emp.name.charAt(0)}
                           </div>
                           <div className="text-left">
                              <p className="text-[10px] font-black uppercase leading-none mb-1">{emp.name}</p>
                              <p className="text-[8px] font-bold uppercase opacity-50">{emp.department}</p>
                           </div>
                        </div>
                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </button>
                  ))}
                  {employeesNotInRun.length === 0 && (
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-10 italic">No available employees</p>
                  )}
               </div>
            </div>
         )}
      </div>
    </div>
  );
}

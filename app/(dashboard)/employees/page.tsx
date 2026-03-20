'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  BadgeCheck, 
  Building2, 
  Briefcase, 
  Phone, 
  Mail,
  Loader2,
  XCircle,
  Plus,
  Banknote
} from 'lucide-react';
import Swal from 'sweetalert2';

type Employee = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  jobRole?: string;
  employmentType?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  joinDate?: string;
  userId?: string;
  basicSalary: number;
  bankName?: string;
  paymentMethod?: string;
  user?: { username: string };
};

const DEPARTMENTS = ['Academic', 'Finance', 'Operations', 'Administration', 'Security', 'Maintenance'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Volunteer'];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<{id: string, username: string}[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Academic',
    jobRole: '',
    employmentType: 'Full-time',
    status: 'ACTIVE',
    joinDate: new Date().toISOString().split('T')[0],
    userId: '',
    basicSalary: 0,
    bankName: '',
    accountNo: '',
    paymentMethod: 'CASH'
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchEmployees();
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: formData.userId || null
        }),
      });
      if (!res.ok) throw new Error('Failed');
      
      setShowAddModal(false);
      setFormData({
        name: '', email: '', phone: '', department: 'Academic', 
        jobRole: '', employmentType: 'Full-time', status: 'ACTIVE', 
        joinDate: new Date().toISOString().split('T')[0], userId: '',
        basicSalary: 0, bankName: '', accountNo: '', paymentMethod: 'CASH'
      });
      fetchEmployees();
      Swal.fire({ icon: 'success', title: 'Employee Added', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add employee' });
    }
  };

  const handleDelete = async (id: string) => {
     const result = await Swal.fire({
       title: 'Delete Employee Record?',
       text: "This will remove the employee's payroll history and profile. System user remains unaffected.",
       icon: 'warning',
       showCancelButton: true,
       confirmButtonText: 'Delete Permanently'
     });

     if (result.isConfirmed) {
        try {
          await fetch(`/api/employees/${id}`, { method: 'DELETE' });
          fetchEmployees();
          Swal.fire('Deleted', 'Employee record removed.', 'success');
        } catch (err) {
          Swal.fire('Error', 'Action failed', 'error');
        }
     }
  };

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.jobRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/50 italic-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/10">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Employee Directory</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">HR & Payroll Unit Identity</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Onboard Employee
        </button>
      </div>

      {/* Stats / Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Workforce</p>
            <h2 className="text-2xl font-black text-slate-900">{employees.length}</h2>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Staff</p>
            <h2 className="text-2xl font-black text-indigo-600">
               {employees.filter(e => e.department === 'Academic').length}
            </h2>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operations</p>
            <h2 className="text-2xl font-black text-emerald-600">
               {employees.filter(e => e.department === 'Operations').length}
            </h2>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Linked</p>
            <h2 className="text-2xl font-black text-amber-600">
               {employees.filter(e => e.userId).length}
            </h2>
         </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
         <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search by name, role, or department..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 rounded-2xl py-4 pl-16 pr-6 outline-none focus:ring-2 focus:ring-indigo-600/20 text-slate-900 font-bold transition-all border border-transparent focus:bg-white focus:border-indigo-600/20"
            />
         </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Information</th>
                     <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment</th>
                     <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Link</th>
                     <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                       <td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                             <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Retrieving HR Database...</p>
                          </div>
                       </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="py-20 text-center opacity-40">
                          <Users className="h-12 w-12 mx-auto text-slate-900 mb-4" />
                          <p className="text-sm font-black text-slate-900 uppercase">No employee records found</p>
                       </td>
                    </tr>
                  ) : (
                    filtered.map(e => (
                      <tr key={e.id} className="group hover:bg-slate-50/30 transition-all">
                        <td className="py-8 px-10">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xl border border-slate-200">
                                 {e.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-lg font-black text-slate-900 leading-none mb-1.5 uppercase tracking-tighter">{e.name}</p>
                                 <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email || 'No Email'}</span>
                                    <span className="flex items-center gap-1 border-l border-slate-200 pl-3"><Phone className="h-3 w-3" /> {e.phone || 'No Phone'}</span>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="py-8 px-10 font-bold text-slate-600">
                           <div className="space-y-1">
                              <p className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                                 <Building2 className="h-3.5 w-3.5 text-indigo-500" /> {e.department}
                              </p>
                              <p className="text-[10px] uppercase tracking-widest flex items-center gap-2">
                                 <Briefcase className="h-3 w-3" /> {e.jobRole}
                              </p>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter pt-1 flex items-center gap-1">
                                 <Banknote className="h-3 w-3" /> KES {Number(e.basicSalary).toLocaleString()}
                              </p>
                           </div>
                        </td>
                        <td className="py-8 px-10">
                           {e.userId ? (
                             <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100">
                                <BadgeCheck className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">@{e.user?.username}</span>
                             </div>
                           ) : (
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Link</span>
                           )}
                        </td>
                        <td className="py-8 px-10">
                           <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                             e.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             e.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                             'bg-rose-50 text-rose-600 border-rose-100'
                           }`}>
                              {e.status}
                           </span>
                        </td>
                        <td className="py-8 px-10 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button className="p-3 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                 <Pencil className="h-5 w-5" />
                              </button>
                              <button onClick={() => handleDelete(e.id)} className="p-3 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all">
                                 <Trash2 className="h-5 w-5" />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
           <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl my-auto animate-in fade-in zoom-in duration-300">
              <div className="p-10 space-y-10">
                 <div className="flex justify-between items-start border-b border-slate-50 pb-8">
                    <div className="flex gap-5">
                       <div className="h-14 w-14 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center">
                          <UserPlus className="h-7 w-7 text-indigo-600" />
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none mb-2">Onboard Employee</h2>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Domain Record Entry</p>
                       </div>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                       <XCircle className="h-8 w-8" />
                    </button>
                 </div>

                 <form onSubmit={handleCreate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Full Legal Name</label>
                          <input 
                            required
                            type="text" 
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all placeholder:text-slate-300"
                            placeholder="John Doe"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Access Link (System Identity)</label>
                          <select 
                            value={formData.userId}
                            onChange={e => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all"
                          >
                             <option value="">No System Login</option>
                             {users.map(u => <option key={u.id} value={u.id}>@{u.username}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Department</label>
                          <select 
                            value={formData.department}
                            onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all"
                          >
                             {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Job Role Title</label>
                          <input 
                            type="text" 
                            value={formData.jobRole}
                            onChange={e => setFormData(prev => ({ ...prev, jobRole: e.target.value }))}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all placeholder:text-slate-300"
                            placeholder="e.g. Senior Teacher"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Employment Type</label>
                          <select 
                            value={formData.employmentType}
                            onChange={e => setFormData(prev => ({ ...prev, employmentType: e.target.value }))}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all"
                          >
                             {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Official Hire Date</label>
                          <input 
                            type="date" 
                            value={formData.joinDate}
                            onChange={e => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Monthly Basic Salary</label>
                          <div className="relative">
                             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">KES</span>
                             <input 
                               type="number" 
                               value={formData.basicSalary}
                               onChange={e => setFormData(prev => ({ ...prev, basicSalary: Number(e.target.value) }))}
                               className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] pl-16 pr-6 py-4 text-sm font-bold outline-none transition-all"
                               placeholder="0.00"
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Payment Method</label>
                          <select 
                            value={formData.paymentMethod}
                            onChange={e => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all"
                          >
                             <option value="CASH">Cash Payment</option>
                             <option value="BANK_TRANSFER">Bank Transfer</option>
                             <option value="MPESA">Mobile Money (MPESA)</option>
                          </select>
                       </div>
                    </div>

                    {formData.paymentMethod !== 'CASH' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">
                                {formData.paymentMethod === 'BANK_TRANSFER' ? 'Bank Name' : 'Provider Name'}
                             </label>
                             <input 
                               type="text" 
                               value={formData.bankName}
                               onChange={e => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                               className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all"
                               placeholder={formData.paymentMethod === 'BANK_TRANSFER' ? 'e.g. Equity Bank' : 'e.g. Safaricom'}
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">
                                {formData.paymentMethod === 'BANK_TRANSFER' ? 'Account Number' : 'Phone Number'}
                             </label>
                             <input 
                               type="text" 
                               value={formData.accountNo}
                               onChange={e => setFormData(prev => ({ ...prev, accountNo: e.target.value }))}
                               className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all"
                               placeholder="Required for payroll"
                             />
                          </div>
                       </div>
                    )}

                    <div className="flex gap-4 pt-10">
                       <button 
                         type="button" 
                         onClick={() => setShowAddModal(false)}
                         className="flex-1 px-8 py-5 rounded-[2rem] border-2 border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all font-sans"
                       >
                          Cancel
                       </button>
                       <button 
                         type="submit"
                         className="flex-[2] bg-slate-900 px-8 py-5 rounded-[2rem] text-xs font-black text-white uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 font-sans"
                       >
                          Finalize Onboarding
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

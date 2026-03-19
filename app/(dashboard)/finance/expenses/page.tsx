'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Wallet, 
  Trash2, 
  Loader2,
  TrendingDown,
  ShoppingBag,
  Zap,
  Hammer,
  Truck,
  MoreVertical
} from 'lucide-react';
import Swal from 'sweetalert2';

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
};

const CATEGORIES = [
  'Rent & Utilities',
  'Salaries & Payroll',
  'Maintenance',
  'Stationery & Supplies',
  'Transport',
  'Food & Refreshments',
  'Other'
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '', category: '' });

  // New Expense State
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filters.from) qs.set('from', filters.from);
    if (filters.to) qs.set('to', filters.to);
    if (filters.category) qs.set('category', filters.category);

    try {
      const res = await fetch(`/api/expenses?${qs.toString()}`);
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });
      if (!res.ok) throw new Error('Failed to create');
      
      setShowAddModal(false);
      setNewExpense({ description: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();

      Swal.fire({
        icon: 'success',
        title: 'Expense Logged',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to log expense' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
        fetchExpenses();
        Swal.fire('Deleted!', 'Expense has been removed.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Failed to delete expense', 'error');
      }
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Salaries & Payroll': return <TrendingDown className="h-4 w-4 text-emerald-500" />;
      case 'Rent & Utilities': return <Zap className="h-4 w-4 text-amber-500" />;
      case 'Maintenance': return <Hammer className="h-4 w-4 text-blue-500" />;
      case 'Transport': return <Truck className="h-4 w-4 text-indigo-500" />;
      case 'Stationery & Supplies': return <ShoppingBag className="h-4 w-4 text-rose-500" />;
      default: return <Wallet className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Expense Tracker</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Spending & Payables</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black text-white shadow-xl hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" />
          Record New Expense
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center">
               <TrendingDown className="h-6 w-6 text-rose-500" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Expenses</p>
               <h2 className="text-3xl font-black text-slate-900 leading-none">KES {totalAmount.toLocaleString()}</h2>
            </div>
         </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
           <Filter className="h-4 w-4 text-slate-400" />
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Filters & Search</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Start Date</label>
            <input 
              type="date" 
              value={filters.from}
              onChange={e => setFilters(prev => ({ ...prev, from: e.target.value }))}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm focus:border-slate-900 transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">End Date</label>
             <input 
              type="date" 
              value={filters.to}
              onChange={e => setFilters(prev => ({ ...prev, to: e.target.value }))}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm focus:border-slate-900 transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Category</label>
             <select 
              value={filters.category}
              onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm focus:border-slate-900 transition-all outline-none appearance-none"
             >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <div className="flex items-end">
             <button 
               onClick={() => setFilters({ from: '', to: '', category: '' })}
               className="w-full rounded-2xl border-2 border-slate-100 bg-white px-4 py-3 text-[10px] font-black text-slate-400 hover:text-slate-900 hover:border-slate-200 transition-all uppercase tracking-widest"
             >
               Clear Filters
             </button>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Category</th>
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
              <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                   <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Expenses...</p>
                   </div>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                 <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                       <ShoppingBag className="h-12 w-12 text-slate-900" />
                       <p className="text-sm font-black text-slate-900 uppercase">No expenses found matching filters.</p>
                    </div>
                 </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="py-6 px-8">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                           {getCategoryIcon(expense.category)}
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{expense.category}</p>
                           <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 leading-none">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(expense.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                           </p>
                        </div>
                     </div>
                  </td>
                  <td className="py-6 px-8">
                     <p className="text-sm font-bold text-slate-600 truncate max-w-[300px]">{expense.description}</p>
                  </td>
                  <td className="py-6 px-8 text-right">
                     <p className="text-lg font-black text-slate-900 leading-none">
                        <span className="text-[10px] text-slate-300 mr-1">KES</span>
                        {Number(expense.amount).toLocaleString()}
                     </p>
                  </td>
                  <td className="py-6 px-8 text-center">
                     <button 
                       onClick={() => handleDelete(expense.id)}
                       className="p-3 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                     >
                        <Trash2 className="h-5 w-5" />
                     </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                   <div>
                      <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase leading-none mb-2">Log Institutional Expense</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Record a new financial transaction</p>
                   </div>
                   <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                      <Plus className="h-6 w-6 rotate-45" />
                   </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Description</label>
                      <input 
                        required
                        type="text" 
                        value={newExpense.description}
                        onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm focus:border-slate-900 transition-all outline-none"
                        placeholder="e.g. Monthly Electricity Bill"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Amount (KES)</label>
                         <input 
                           required
                           type="number" 
                           value={newExpense.amount}
                           onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                           className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-black focus:border-slate-900 transition-all outline-none text-emerald-600"
                           placeholder="0.00"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Category</label>
                         <select 
                           value={newExpense.category}
                           onChange={e => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                           className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm focus:border-slate-900 transition-all outline-none"
                         >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Transaction Date</label>
                      <input 
                        required
                        type="date" 
                        value={newExpense.date}
                        onChange={e => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm focus:border-slate-900 transition-all outline-none"
                      />
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                         type="button"
                         onClick={() => setShowAddModal(false)}
                         className="flex-1 rounded-2xl border-2 border-slate-100 px-4 py-4 text-xs font-black text-slate-400 hover:text-slate-900 hover:border-slate-200 transition-all uppercase tracking-widest"
                      >
                         Cancel
                      </button>
                      <button 
                         type="submit"
                         className="flex-[2] rounded-2xl bg-slate-900 px-4 py-4 text-xs font-black text-white shadow-xl hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest"
                      >
                         Securely Record Expense
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

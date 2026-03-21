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
  Receipt,
  Download,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  CalendarDays
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
};

const CATEGORIES = [
  'Rent & Utilities',
  'Payroll & Staffing',
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
      title: 'Remove Expense?',
      text: "This transaction will be permanently deleted from the records.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
        fetchExpenses();
        Swal.fire({ icon: 'success', title: 'Removed', timer: 1000, showConfirmButton: false, toast: true });
      } catch (err) {
        Swal.fire('Error', 'Failed to delete expense', 'error');
      }
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Payroll & Staffing': return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'Rent & Utilities': return <Zap className="h-4 w-4 text-amber-500" />;
      case 'Maintenance': return <Hammer className="h-4 w-4 text-blue-500" />;
      case 'Transport': return <Truck className="h-4 w-4 text-indigo-500" />;
      case 'Stationery & Supplies': return <ShoppingBag className="h-4 w-4 text-rose-500" />;
      case 'Other': return <Building2 className="h-4 w-4 text-slate-400" />;
      default: return <Wallet className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/50">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 flex items-center justify-center rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20">
            <Receipt className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Institutional Expenses</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Treasury & Expenditure Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="h-14 px-8 rounded-2xl border-2 border-slate-200 font-black uppercase text-[10px] tracking-widest hover:bg-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Statements
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="h-14 px-8 rounded-2xl bg-slate-900 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Transaction
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="rounded-[3rem] border-none bg-white p-2 shadow-sm">
            <CardContent className="p-8 flex items-center gap-6">
               <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center shadow-inner">
                  <TrendingDown className="h-7 w-7 text-rose-500" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expenditure</p>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">KES {totalAmount.toLocaleString()}</h2>
               </div>
            </CardContent>
         </Card>

         <Card className="rounded-[3rem] border-none bg-white p-2 shadow-sm overflow-hidden relative group">
            <div className="absolute inset-0 bg-slate-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            <CardContent className="p-8 flex items-center gap-6 relative transition-colors duration-500 group-hover:text-white">
               <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-white/10">
                  <CalendarDays className="h-7 w-7 text-slate-400 group-hover:text-white/80" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-white/40">Current Month</p>
                  <h2 className="text-4xl font-black tracking-tighter">{new Date().toLocaleString('default', { month: 'long' })}</h2>
               </div>
            </CardContent>
         </Card>

         <Card className="rounded-[3rem] border-none bg-indigo-600 p-2 shadow-2xl shadow-indigo-600/20">
            <CardContent className="p-8 flex items-center gap-6 text-white">
               <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Zap className="h-7 w-7 text-indigo-100" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-indigo-100/60 uppercase tracking-widest mb-1">Efficiency</p>
                  <h2 className="text-4xl font-black tracking-tighter">Optimized</h2>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="xl:col-span-1 space-y-6">
           <Card className="rounded-[2.5rem] border-none bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                 <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filters
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Date Range</label>
                    <div className="space-y-3">
                       <Input 
                        type="date" 
                        value={filters.from}
                        onChange={e => setFilters(prev => ({ ...prev, from: e.target.value }))}
                        className="h-12 rounded-2xl bg-slate-50 border-transparent focus:ring-0 focus:border-slate-300" 
                       />
                       <Input 
                        type="date" 
                        value={filters.to}
                        onChange={e => setFilters(prev => ({ ...prev, to: e.target.value }))}
                        className="h-12 rounded-2xl bg-slate-50 border-transparent focus:ring-0 focus:border-slate-300"
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Classification</label>
                    <select 
                      value={filters.category}
                      onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-12 rounded-2xl bg-slate-50 border-transparent text-sm font-bold appearance-none px-4 outline-none focus:ring-0 focus:border-slate-300"
                    >
                       <option value="">All Categories</option>
                       {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>

                 <Button 
                    onClick={() => setFilters({ from: '', to: '', category: '' })}
                    variant="ghost" 
                    className="w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900"
                 >
                    Reset Dashboard
                 </Button>
              </CardContent>
           </Card>
        </div>

        {/* Expenses List */}
        <div className="xl:col-span-3">
           <Card className="rounded-[3rem] border-none bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset / Category</th>
                          <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
                          <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
                          <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {loading ? (
                          <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-200" /></td></tr>
                       ) : expenses.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-32 text-center opacity-20">
                               <ShoppingBag className="h-20 w-20 mx-auto text-slate-900" />
                               <p className="mt-4 font-black uppercase tracking-widest text-xs">No Records Located</p>
                            </td>
                          </tr>
                       ) : (
                          expenses.map(e => (
                             <tr key={e.id} className="group hover:bg-slate-50/30 transition-all">
                                <td className="py-8 px-10">
                                   <div className="flex items-center gap-5">
                                      <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                         {getCategoryIcon(e.category)}
                                      </div>
                                      <div>
                                         <p className="text-sm font-black text-slate-900 leading-none mb-1">{e.category}</p>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(e.date).toLocaleDateString()}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="py-8 px-10">
                                   <p className="text-sm font-bold text-slate-600 italic max-w-xs truncate">{e.description}</p>
                                </td>
                                <td className="py-8 px-10 text-right">
                                   <p className="text-xl font-black text-slate-900 tracking-tighter">KES {Number(e.amount).toLocaleString()}</p>
                                </td>
                                <td className="py-8 px-10 text-right">
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDelete(e.id)}
                                      className="rounded-xl opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                   >
                                      <Trash2 className="h-5 w-5" />
                                   </Button>
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      </div>

      {/* Modern Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-12 space-y-10">
                <div className="flex justify-between items-start">
                   <div>
                      <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">Issue Expenditure</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">New Financial Entry</p>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full hover:bg-slate-50"><X className="h-6 w-6" /></Button>
                </div>

                <form onSubmit={handleCreate} className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Description</label>
                      <Input 
                        required
                        value={newExpense.description}
                        onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))}
                        className="h-16 rounded-2xl bg-slate-50 border-none px-6 text-sm font-bold"
                        placeholder="Purpose of transaction..."
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Amount (KES)</label>
                         <Input 
                            required
                            type="number"
                            value={newExpense.amount}
                            onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                            className="h-16 rounded-2xl bg-slate-50 border-none px-6 text-xl font-black text-emerald-600"
                            placeholder="0.00"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Category</label>
                         <select 
                            value={newExpense.category}
                            onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))}
                            className="w-full h-16 rounded-2xl bg-slate-50 border-none px-6 text-sm font-bold outline-none"
                         >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Transaction Date</label>
                      <Input 
                        required
                        type="date"
                        value={newExpense.date}
                        onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))}
                        className="h-16 rounded-2xl bg-slate-50 border-none px-6 text-sm font-bold"
                      />
                   </div>

                   <div className="flex gap-4 pt-4">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 h-16 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-400"
                      >
                         Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="flex-[2] h-16 rounded-3xl bg-slate-900 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20"
                      >
                         Authorize Payment
                      </Button>
                   </div>
                </form>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
}

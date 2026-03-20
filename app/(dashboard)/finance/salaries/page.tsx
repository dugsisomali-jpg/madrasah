'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Trash2, Wallet, Calendar, XCircle, Banknote } from 'lucide-react';
import Swal from 'sweetalert2';

interface Employee {
  id: string;
  name: string;
  basicSalary: number;
  jobRole: string;
}

interface SalaryPayment {
  id: string;
  employeeId: string;
  amount: number;
  month: number;
  year: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  employee: {
    name: string;
    jobRole: string;
  }
}

export default function SalariesPage() {
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        fetch('/api/finance/salaries'),
        fetch('/api/employees')
      ]);
      const payData = await payRes.json();
      const empData = await empRes.json();
      setPayments(Array.isArray(payData) ? payData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finance/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to record payment');
      
      setIsModalOpen(false);
      setFormData({
        employeeId: '',
        amount: '',
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear()),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        reference: '',
        notes: ''
      });
      fetchData();
      Swal.fire({ icon: 'success', title: 'Payment Recorded', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to record salary payment' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Record?',
      text: "This will remove the salary payment record. This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/finance/salaries?id=${id}`, { method: 'DELETE' });
        fetchData();
        Swal.fire('Deleted', 'Record removed.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Action failed', 'error');
      }
    }
  };

  const filtered = payments.filter(p => 
    p.employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeSelect = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setFormData(prev => ({ ...prev, employeeId: id, amount: String(emp.basicSalary) }));
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Salary Management</h1>
          <p className="text-muted-foreground mt-1">Record and track staff salary payments.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="h-12 px-6 rounded-xl font-bold bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="h-5 w-5 mr-2" />
          Pay Salary
        </Button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl my-auto animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-start border-b border-slate-50 pb-6 mb-6">
                <h2 className="text-2xl font-bold">Record Salary Payment</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Employee</label>
                    <select 
                      required
                      value={formData.employeeId}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                      className="w-full h-12 bg-slate-50 rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                    >
                      <option value="">Select staff member</option>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.jobRole})</SelectItem>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Amount</label>
                      <Input 
                        required
                        type="number" 
                        value={formData.amount} 
                        onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        className="h-12 rounded-xl bg-slate-50"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Payment Date</label>
                      <Input 
                        required
                        type="date" 
                        value={formData.paymentDate} 
                        onChange={e => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                        className="h-12 rounded-xl bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Month</label>
                      <select 
                        required
                        value={formData.month} 
                        onChange={e => setFormData(prev => ({ ...prev, month: e.target.value }))}
                        className="w-full h-12 bg-slate-50 rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i+1} value={String(i+1)}>
                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Year</label>
                      <Input 
                        required
                        type="number" 
                        value={formData.year} 
                        onChange={e => setFormData(prev => ({ ...prev, year: e.target.value }))}
                        className="h-12 rounded-xl bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Payment Method</label>
                    <select 
                      value={formData.paymentMethod} 
                      onChange={e => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full h-12 bg-slate-50 rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="MPESA">M-Pesa</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl">Cancel</Button>
                  <Button type="submit" className="flex-[2] h-12 rounded-xl bg-slate-900 hover:bg-slate-800">Record Payment</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 pb-8 pt-8 px-8 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-400" />
              Payment History
            </h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search employee..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</TableHead>
                <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Month/Year</TableHead>
                <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</TableHead>
                <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Method</TableHead>
                <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Amount</TableHead>
                <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="p-8"><Skeleton className="h-12 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center text-muted-foreground opacity-60">
                    <Wallet className="h-12 w-12 mx-auto mb-4" />
                    No payment records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                    <td className="py-6 px-8">
                      <div className="font-bold text-slate-900">{p.employee?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.employee?.jobRole || 'Staff'}</div>
                    </td>
                    <td className="py-6 px-8 font-bold text-slate-600">
                      {new Date(2000, p.month - 1).toLocaleString('default', { month: 'short' })} {p.year}
                    </td>
                    <td className="py-6 px-8 text-slate-500 font-bold text-sm">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-6 px-8">
                      <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-200 text-slate-600 font-bold text-[9px] px-3 py-1 uppercase tracking-widest">
                        {p.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-6 px-8 text-right font-black text-slate-900 uppercase tracking-tighter">
                      KES {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-6 px-8 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(p.id)}
                        className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SelectItem({ value, children }: { value: string, children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}

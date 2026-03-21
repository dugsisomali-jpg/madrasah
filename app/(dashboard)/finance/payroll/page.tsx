'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Search, 
  Trash2, 
  Wallet, 
  Calendar, 
  XCircle, 
  Banknote, 
  HandCoins, 
  TrendingUp, 
  History,
  CheckCircle2,
  Clock,
  ArrowDownCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Employee {
  id: string;
  name: string;
  basicSalary: number;
  jobRole: string;
}

interface Loan {
  id: string;
  employeeId: string;
  amount: number;
  interestRate: number;
  tenorMonths: number;
  monthlyInstallment: number;
  remainingBalance: number;
  startDate: string;
  status: 'ACTIVE' | 'CLOSED';
  employee: { name: string };
}

interface Advance {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'DEDUCTED';
  employee: { name: string };
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  amount: number;
  loanDeduction: number;
  advanceDeduction: number;
  netSalary: number;
  month: number;
  year: number;
  paymentDate: string;
  paymentMethod: string;
  employee: { name: string, jobRole: string };
}

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState('payroll');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);

  // Form States
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1 + '');
  const [year, setYear] = useState(new Date().getFullYear() + '');

  const fetchTabContent = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      const endpoint = tab === 'payroll' ? '/api/finance/payroll' : 
                      tab === 'loans' ? '/api/finance/loans' : 
                      '/api/finance/advances';
      const res = await fetch(endpoint);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      
      if (tab === 'payroll') setRecords(list);
      else if (tab === 'loans') setLoans(list);
      else if (tab === 'advances') setAdvances(list);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTabContent(activeTab);
  }, [activeTab, fetchTabContent]);

  const handleProcessPayroll = async () => {
    if (!selectedEmployeeId || !amount || !month || !year) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/finance/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          amount,
          month,
          year,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'BANK_TRANSFER'
        })
      });

      if (res.ok) {
        Swal.fire('Success', 'Payroll processed successfully', 'success');
        setIsPayrollOpen(false);
        fetchTabContent('payroll');
        resetForm();
      } else {
        const err = await res.json();
        Swal.fire('Error', err.error || 'Failed to process payroll', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Connection error', 'error');
    }
  };

  const handleIssueLoan = async () => {
    if (!selectedEmployeeId || !amount) {
      Swal.fire('Error', 'Employee and amount are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/finance/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          amount,
          interestRate: 0,
          tenorMonths: 12,
          startDate: new Date().toISOString(),
          notes
        })
      });

      if (res.ok) {
        Swal.fire('Success', 'Loan issued successfully', 'success');
        setIsLoanOpen(false);
        fetchTabContent('loans');
        resetForm();
      }
    } catch (err) { console.error(err); }
  };

  const handleRequestAdvance = async () => {
    if (!selectedEmployeeId || !amount) {
      Swal.fire('Error', 'Employee and amount are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/finance/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          amount,
          notes
        })
      });

      if (res.ok) {
        Swal.fire('Success', 'Advance request submitted', 'success');
        setIsAdvanceOpen(false);
        fetchTabContent('advances');
        resetForm();
      }
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setSelectedEmployeeId('');
    setAmount('');
    setNotes('');
  };

  return (
    <div className="p-10 space-y-12 min-h-screen bg-[#FDFDFE] selection:bg-indigo-100 italic-text">
       <style jsx global>{`
        .italic-text h1, .italic-text h2, .italic-text h3, .italic-text .italic {
          font-style: italic;
        }
      `}</style>
      
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 flex items-center justify-center rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/10">
            <Banknote className="h-10 w-10 animate-pulse" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none italic">Financial Payroll Hub</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Advanced Personnel Compensation & Assets Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {activeTab === 'payroll' && (
             <Dialog open={isPayrollOpen} onOpenChange={setIsPayrollOpen}>
                <DialogTrigger asChild>
                   <Button className="h-16 px-10 rounded-2xl bg-slate-900 hover:scale-105 transition-all text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-slate-900/20">
                      <Plus className="mr-2 h-5 w-5" /> Process Payroll
                   </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] p-10 max-w-xl border-none shadow-2xl">
                   <DialogHeader>
                      <DialogTitle className="text-3xl font-black uppercase italic tracking-tight">Process Net Salary</DialogTitle>
                      <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Initialize disbursement for the current period</DialogDescription>
                   </DialogHeader>
                   <div className="space-y-6 py-8">
                      <div className="space-y-3 relative">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Employee</Label>
                         <div className="relative">
                            <select 
                              className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 font-black text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer"
                              value={selectedEmployeeId}
                              onChange={(e) => {
                                 const val = e.target.value;
                                 setSelectedEmployeeId(val);
                                 const emp = employees.find(e => e.id === val);
                                 if (emp) setAmount(emp.basicSalary.toString());
                              }}
                            >
                               <option value="">Select Staff Member</option>
                               {employees.map(e => (
                                 <option key={e.id} value={e.id}>{e.name} ({e.jobRole})</option>
                               ))}
                            </select>
                            <ChevronDown className="absolute right-6 top-5 h-4 w-4 text-slate-400 pointer-events-none" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Month</Label>
                            <Input value={month} onChange={(e) => setMonth(e.target.value)} className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-black" />
                         </div>
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Year</Label>
                            <Input value={year} onChange={(e) => setYear(e.target.value)} className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-black" />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Basic Salary Amount</Label>
                         <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl border-slate-100 bg-emerald-50/50 font-black text-emerald-600 text-xl" />
                      </div>
                   </div>
                   <DialogFooter>
                      <Button onClick={handleProcessPayroll} className="w-full h-16 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em]">Authorize Payment</Button>
                   </DialogFooter>
                </DialogContent>
             </Dialog>
           )}

           {activeTab === 'loans' && (
             <Dialog open={isLoanOpen} onOpenChange={setIsLoanOpen}>
                <DialogTrigger asChild>
                   <Button className="h-16 px-10 rounded-2xl bg-indigo-600 hover:scale-105 transition-all text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-indigo-600/20">
                      <HandCoins className="mr-2 h-5 w-5" /> Issue Staff Loan
                   </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] p-10 max-w-xl border-none shadow-2xl">
                   <DialogHeader>
                      <DialogTitle className="text-3xl font-black uppercase italic tracking-tight">Credit Facility Issuance</DialogTitle>
                      <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Formalize debt obligation for institutional staff</DialogDescription>
                   </DialogHeader>
                   <div className="space-y-6 py-8">
                      <div className="space-y-3 relative">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Beneficiary</Label>
                         <div className="relative">
                            <select 
                              className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 font-black text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
                              value={selectedEmployeeId}
                              onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            >
                               <option value="">Select Staff Member</option>
                               {employees.map(e => (
                                 <option key={e.id} value={e.id}>{e.name}</option>
                               ))}
                            </select>
                            <ChevronDown className="absolute right-6 top-5 h-4 w-4 text-slate-400 pointer-events-none" />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Principal Amount</Label>
                         <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl border-slate-100 font-black text-slate-900 text-xl" />
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Facility Notes</Label>
                         <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms or repayment details..." className="h-14 rounded-2xl border-slate-100" />
                      </div>
                   </div>
                   <DialogFooter>
                      <Button onClick={handleIssueLoan} className="w-full h-16 rounded-2xl bg-indigo-600 font-black uppercase tracking-[0.2em]">Disburse Funds</Button>
                   </DialogFooter>
                </DialogContent>
             </Dialog>
           )}

           {activeTab === 'advances' && (
             <Dialog open={isAdvanceOpen} onOpenChange={setIsAdvanceOpen}>
                <DialogTrigger asChild>
                   <Button className="h-16 px-10 rounded-2xl bg-emerald-600 hover:scale-105 transition-all text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-emerald-600/20">
                      <TrendingUp className="mr-2 h-5 w-5" /> Request Advance
                   </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] p-10 max-w-xl border-none shadow-2xl">
                   <DialogHeader>
                      <DialogTitle className="text-3xl font-black uppercase italic tracking-tight">Salary Advance Request</DialogTitle>
                      <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Initialize a mid-month compensation request</DialogDescription>
                   </DialogHeader>
                   <div className="space-y-6 py-8">
                      <div className="space-y-3 relative">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Employee</Label>
                         <div className="relative">
                            <select 
                              className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 font-black text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all cursor-pointer"
                              value={selectedEmployeeId}
                              onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            >
                               <option value="">Select Staff Member</option>
                               {employees.map(e => (
                                 <option key={e.id} value={e.id}>{e.name}</option>
                               ))}
                            </select>
                            <ChevronDown className="absolute right-6 top-5 h-4 w-4 text-slate-400 pointer-events-none" />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Advance Amount</Label>
                         <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl border-slate-100 font-black text-emerald-600 text-xl" />
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reasoning</Label>
                         <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Emergency or planned advance..." className="h-14 rounded-2xl border-slate-100" />
                      </div>
                   </div>
                   <DialogFooter>
                      <Button onClick={handleRequestAdvance} className="w-full h-16 rounded-2xl bg-emerald-600 font-black uppercase tracking-[0.2em]">Authorize Advance</Button>
                   </DialogFooter>
                </DialogContent>
             </Dialog>
           )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
        <TabsList className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 h-20 w-fit gap-2">
          <TabsTrigger value="payroll" className="rounded-[2rem] px-10 h-full font-black uppercase text-[11px] tracking-[0.2em] data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Monthly Payroll</TabsTrigger>
          <TabsTrigger value="loans" className="rounded-[2rem] px-10 h-full font-black uppercase text-[11px] tracking-[0.2em] data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Staff Loans</TabsTrigger>
          <TabsTrigger value="advances" className="rounded-[2rem] px-10 h-full font-black uppercase text-[11px] tracking-[0.2em] data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Advances</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <Card className="rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden bg-white">
              <Table>
                 <TableHeader className="bg-[#F9FAFB] border-b border-slate-50 text-indigo-500 font-black">
                    <TableRow className="hover:bg-transparent">
                       <TableHead className="py-10 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Institutional Staff</TableHead>
                       <TableHead className="py-10 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Accounting Period</TableHead>
                       <TableHead className="py-10 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] text-right">Gross Principal</TableHead>
                       <TableHead className="py-10 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] text-right">Adjustments</TableHead>
                       <TableHead className="py-10 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] text-right">Net Settlement</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loading ? (
                       <TableRow><TableCell colSpan={5} className="py-40 text-center"><div className="h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto pb-4" /><p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-6 animate-pulse">Establishing Secure Stream...</p></TableCell></TableRow>
                    ) : records.length === 0 ? (
                       <TableRow><TableCell colSpan={5} className="py-40 text-center text-slate-200 font-black uppercase tracking-[0.4em] opacity-30 italic leading-loose"><History className="mx-auto size-20 mb-8 opacity-20" /> No Synchronized Ledger Records</TableCell></TableRow>
                    ) : records.map(r => (
                       <TableRow key={r.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                          <TableCell className="py-10 px-12">
                             <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 font-black text-xs shadow-inner">#ID</div>
                                <div>
                                   <p className="font-black text-slate-900 text-sm uppercase italic">{r.employee?.name || 'Unknown Staff'}</p>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">{r.employee?.jobRole || 'No Role'}</p>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="py-10 px-12 text-slate-600">
                             <Badge variant="outline" className="rounded-xl px-5 py-2 font-black text-[10px] uppercase tracking-widest bg-slate-50 border-slate-100 text-slate-600">
                                {new Date(2000, (r.month || 1) - 1).toLocaleString('default', { month: 'long' })} {r.year}
                             </Badge>
                          </TableCell>
                          <TableCell className="py-10 px-12 text-right font-black text-slate-400 text-sm italic">{Number(r.amount || 0).toLocaleString()} <span className="opacity-40 text-[9px] ml-1 uppercase">KES</span></TableCell>
                          <TableCell className="py-10 px-12 text-right text-rose-500 font-black italic text-sm">
                             - {(Number(r.loanDeduction || 0) + Number(r.advanceDeduction || 0)).toLocaleString()} <span className="opacity-40 text-[9px] ml-1 uppercase">KES</span>
                          </TableCell>
                          <TableCell className="py-10 px-12 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-3xl font-black text-slate-900 tracking-tighter italic">{Number(r.netSalary || 0).toLocaleString()}</span>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 opacity-60">Verified Settlement</span>
                             </div>
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {loading ? (
              <div className="py-40 text-center text-slate-400 font-black uppercase tracking-[0.5em] animate-pulse italic">Scanning Asset Database...</div>
           ) : loans.length === 0 ? (
              <div className="py-40 text-center text-slate-200 font-black uppercase tracking-[0.4em] opacity-30 italic"><ArrowDownCircle className="mx-auto size-20 mb-8 opacity-20" /> No Active Credit Facilities</div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {loans.map(loan => (
                    <Card key={loan.id} className="rounded-[4rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-700 group overflow-hidden bg-white">
                       <div className="p-12 space-y-8">
                          <div className="flex justify-between items-start">
                             <div className="h-16 w-16 rounded-[1.8rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-700 shadow-inner">
                                <HandCoins className="h-8 w-8 text-indigo-500 group-hover:text-white transition-all duration-700" />
                             </div>
                             <Badge className={`rounded-[1rem] px-6 py-2.5 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg border-none ${loan.status === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-emerald-900/10' : 'bg-slate-100 text-slate-500 shadow-none'}`}>
                                {loan.status}
                             </Badge>
                          </div>
                          <div>
                             <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">{loan.employee?.name || 'Staff Obligor'}</p>
                             <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">{Number(loan.amount || 0).toLocaleString()} <span className="text-xs font-black opacity-30 italic leading-none">KES</span></h3>
                          </div>
                          <div className="space-y-4 pt-10 border-t border-slate-50">
                             <div className="flex justify-between items-center group/item">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Monthly Commitment</span>
                                <span className="text-sm font-black text-slate-900 tracking-tight italic">KES {Number(loan.monthlyInstallment || 0).toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center bg-rose-50/50 p-6 rounded-[2.5rem] border border-rose-100/50 transition-all group-hover:bg-rose-50">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Total Liability</span>
                                <span className="text-2xl font-black text-rose-600 tracking-tighter italic">{Number(loan.remainingBalance || 0).toLocaleString()}</span>
                             </div>
                          </div>
                       </div>
                    </Card>
                 ))}
              </div>
           )}
        </TabsContent>

        <TabsContent value="advances" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <Card className="rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden bg-white">
              <Table>
                 <TableHeader className="bg-[#F9FAFB] border-b border-slate-50">
                    <TableRow className="hover:bg-transparent text-indigo-500 font-bold">
                       <TableHead className="py-10 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Staff Member</TableHead>
                       <TableHead className="py-10 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Request Timestamp</TableHead>
                       <TableHead className="py-10 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Disbursement Status</TableHead>
                       <TableHead className="py-10 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] text-right">Requested Allocation</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loading ? (
                       <TableRow><TableCell colSpan={4} className="py-40 text-center"><div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto pb-4" /><p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-6 animate-pulse">Auditing Secure Ledger...</p></TableCell></TableRow>
                    ) : advances.length === 0 ? (
                       <TableRow><TableCell colSpan={4} className="py-40 text-center text-slate-300 font-black uppercase tracking-[0.4em] opacity-40 italic"><TrendingUp className="mx-auto size-20 mb-8 opacity-20" /> No Pending Advance Obligations Found</TableCell></TableRow>
                    ) : advances.map(a => (
                       <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                          <TableCell className="py-10 px-12">
                             <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-300 font-black text-xs shadow-inner uppercase tracking-tighter shadow-sm">STAFF</div>
                                <div>
                                   <p className="font-black text-slate-900 text-sm uppercase italic">{a.employee?.name || 'Staff Member'}</p>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">Advance Beneficiary</p>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="py-10 px-12 text-slate-400 font-black text-[11px] uppercase italic tracking-widest opacity-80">{new Date(a.date).toLocaleDateString()}</TableCell>
                          <TableCell className="py-10 px-12">
                             <Badge variant="outline" className={`rounded-2xl h-10 px-6 flex items-center justify-center font-black text-[10px] uppercase tracking-[0.2em] border-none shadow-xl transition-all duration-700 ${
                                a.status === 'APPROVED' ? 'bg-emerald-600 text-white shadow-emerald-900/10' :
                                a.status === 'PENDING' ? 'bg-amber-500 text-white shadow-amber-900/10' :
                                'bg-slate-900 text-white shadow-slate-900/10'
                             }`}>
                                {a.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="py-10 px-12 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-3xl font-black text-slate-900 tracking-tighter italic">{Number(a.amount || 0).toLocaleString()} <span className="text-xs opacity-30 italic leading-none ml-1">KES</span></span>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 opacity-60">Verified Request</span>
                             </div>
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

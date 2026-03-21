'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowDownCircle
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

  useEffect(() => {
    fetchBaseData();
  }, []);

  const fetchBaseData = async () => {
    try {
      const empRes = await fetch('/api/employees');
      const empData = await empRes.json();
      setEmployees(Array.isArray(empData) ? empData : []);
      fetchTabContent('payroll');
    } catch (err) { console.error(err); }
  };

  const fetchTabContent = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'payroll') {
        const res = await fetch('/api/finance/payroll');
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } else if (tab === 'loans') {
        const res = await fetch('/api/finance/loans');
        const data = await res.json();
        setLoans(Array.isArray(data) ? data : []);
      } else if (tab === 'advances') {
        const res = await fetch('/api/finance/advances');
        const data = await res.json();
        setAdvances(Array.isArray(data) ? data : []);
      }
    } catch (err) { 
      console.error(err); 
      setRecords([]);
      setLoans([]);
      setAdvances([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTabContent(activeTab);
  }, [activeTab]);

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/50">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 flex items-center justify-center rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20">
            <Banknote className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Financial Payroll Hub</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Personnel Compensation & Assets</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <Button className="h-14 px-8 rounded-2xl bg-slate-900 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20">
              <Plus className="mr-2 h-4 w-4" /> 
              {activeTab === 'payroll' ? 'Process Payroll' : activeTab === 'loans' ? 'Issue Loan' : 'Request Advance'}
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm h-14">
          <TabsTrigger value="payroll" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">Monthly Payroll</TabsTrigger>
          <TabsTrigger value="loans" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">Staff Loans</TabsTrigger>
          <TabsTrigger value="advances" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">Advances</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-6">
           <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
              <Table>
                 <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                    <TableRow>
                       <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</TableHead>
                       <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Period</TableHead>
                       <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Gross</TableHead>
                       <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Deductions</TableHead>
                       <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Net Salary</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loading ? (
                       <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse italic">Scanning Ledger...</TableCell></TableRow>
                    ) : records.length === 0 ? (
                       <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest opacity-20"><History className="size-16 mx-auto mb-4" /> No Records Synchronized</TableCell></TableRow>
                    ) : records.map(r => (
                       <TableRow key={r.id} className="group hover:bg-slate-50/30 transition-colors">
                          <TableCell className="py-8 px-10">
                             <p className="font-black text-slate-900 text-sm">{r.employee?.name || 'Unknown Staff'}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.employee?.jobRole || 'No Role assigned'}</p>
                          </TableCell>
                          <TableCell className="py-8 px-10 font-bold text-slate-600 uppercase text-[10px] tracking-widest">
                             {new Date(2000, (r.month || 1) - 1).toLocaleString('default', { month: 'short' })} {r.year}
                          </TableCell>
                          <TableCell className="py-8 px-10 text-right font-bold text-slate-600">KES {Number(r.amount || 0).toLocaleString()}</TableCell>
                          <TableCell className="py-8 px-10 text-right text-rose-500 font-bold italic text-sm">
                             - KES {(Number(r.loanDeduction || 0) + Number(r.advanceDeduction || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-8 px-10 text-right font-black text-slate-900 text-2xl tracking-tighter">
                             KES {Number(r.netSalary || 0).toLocaleString()}
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
           {loading ? (
              <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse italic">Retrieving Asset Records...</div>
           ) : loans.length === 0 ? (
              <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest opacity-20"><ArrowDownCircle className="size-16 mx-auto mb-4" /> No Active Loans</div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {loans.map(loan => (
                    <Card key={loan.id} className="rounded-[3rem] border-none shadow-sm hover:shadow-2xl transition-all group overflow-hidden bg-white">
                       <div className="p-10 space-y-6">
                          <div className="flex justify-between items-start">
                             <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
                                <HandCoins className="h-7 w-7 text-indigo-500 group-hover:text-white transition-colors duration-500" />
                             </div>
                             <Badge className={`rounded-xl px-4 py-1.5 font-black text-[9px] uppercase tracking-widest ${loan.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-transparent'}`}>
                                {loan.status}
                             </Badge>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{loan.employee?.name || 'Unknown Staff'}</p>
                             <h3 className="text-3xl font-black text-slate-900 tracking-tighter">KES {Number(loan.amount || 0).toLocaleString()}</h3>
                          </div>
                          <div className="space-y-3 pt-6 border-t border-slate-50">
                             <div className="flex justify-between text-[10px] font-black">
                                <span className="text-slate-400 uppercase tracking-widest">Monthly Commitment</span>
                                <span className="text-slate-900 tracking-tight">KES {Number(loan.monthlyInstallment || 0).toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-[10px] font-black">
                                <span className="text-slate-400 uppercase tracking-widest">Unpaid Balance</span>
                                <span className="text-rose-600 tracking-tight italic">KES {Number(loan.remainingBalance || 0).toLocaleString()}</span>
                             </div>
                          </div>
                       </div>
                    </Card>
                 ))}
              </div>
           )}
        </TabsContent>

        <TabsContent value="advances" className="space-y-6">
           <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
              <Table>
                 <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                    <TableRow>
                       <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</TableHead>
                       <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</TableHead>
                       <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</TableHead>
                       <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Amount</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loading ? (
                       <TableRow><TableCell colSpan={4} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse italic">Auditing Advances...</TableCell></TableRow>
                    ) : advances.length === 0 ? (
                       <TableRow><TableCell colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest opacity-20"><History className="size-16 mx-auto mb-4" /> No Current Requests</TableCell></TableRow>
                    ) : advances.map(a => (
                       <TableRow key={a.id} className="group hover:bg-slate-50/30 transition-colors">
                          <TableCell className="py-8 px-10 font-black text-slate-900 text-sm">{a.employee?.name || 'Unknown Staff'}</TableCell>
                          <TableCell className="py-8 px-10 text-slate-500 font-bold text-[10px] uppercase tracking-widest">{new Date(a.date).toLocaleDateString()}</TableCell>
                          <TableCell className="py-8 px-10">
                             <Badge variant="outline" className="rounded-full font-black text-[9px] uppercase tracking-widest px-4 py-1">
                                {a.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="py-8 px-10 text-right font-black text-slate-900 text-xl tracking-tighter">
                             KES {Number(a.amount || 0).toLocaleString()}
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

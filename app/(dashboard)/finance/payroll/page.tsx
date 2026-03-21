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
        setRecords(await res.json());
      } else if (tab === 'loans') {
        const res = await fetch('/api/finance/loans');
        setLoans(await res.json());
      } else if (tab === 'advances') {
        const res = await fetch('/api/finance/advances');
        setAdvances(await res.json());
      }
    } catch (err) { console.error(err); }
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
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl">
            <Banknote className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Financial Payroll Hub</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel Compensation & Assets</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <Button className="h-12 px-6 rounded-2xl bg-slate-900 font-bold">
              <Plus className="mr-2 h-4 w-4" /> 
              {activeTab === 'payroll' ? 'Process Payroll' : activeTab === 'loans' ? 'Issue Loan' : 'Request Advance'}
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm h-14">
          <TabsTrigger value="payroll" className="rounded-xl px-8 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Monthly Payroll</TabsTrigger>
          <TabsTrigger value="loans" className="rounded-xl px-8 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Staff Loans</TabsTrigger>
          <TabsTrigger value="advances" className="rounded-xl px-8 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Advances</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-6">
           <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
              <Table>
                 <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                    <TableRow>
                       <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</TableHead>
                       <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Period</TableHead>
                       <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Gross</TableHead>
                       <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Deductions</TableHead>
                       <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Net Salary</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {records.map(r => (
                       <TableRow key={r.id} className="hover:bg-slate-50/30 transition-colors">
                          <TableCell className="py-6 px-8">
                             <p className="font-black text-slate-900">{r.employee.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.employee.jobRole}</p>
                          </TableCell>
                          <TableCell className="py-6 px-8 font-bold text-slate-600 uppercase text-xs">
                             {new Date(2000, r.month - 1).toLocaleString('default', { month: 'short' })} {r.year}
                          </TableCell>
                          <TableCell className="py-6 px-8 text-right font-bold text-slate-600">KES {Number(r.amount).toLocaleString()}</TableCell>
                          <TableCell className="py-6 px-8 text-right text-rose-500 font-bold italic">
                             - KES {(Number(r.loanDeduction) + Number(r.advanceDeduction)).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-6 px-8 text-right font-black text-slate-900 text-lg tracking-tighter">
                             KES {Number(r.netSalary).toLocaleString()}
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loans.map(loan => (
                 <Card key={loan.id} className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                    <div className="p-8 space-y-6">
                       <div className="flex justify-between items-start">
                          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                             <HandCoins className="h-6 w-6 text-indigo-500" />
                          </div>
                          <Badge className={loan.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-transparent'}>
                             {loan.status}
                          </Badge>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{loan.employee.name}</p>
                          <h3 className="text-2xl font-black text-slate-900 leading-none">KES {Number(loan.amount).toLocaleString()}</h3>
                       </div>
                       <div className="space-y-3 pt-4 border-t border-slate-50">
                          <div className="flex justify-between text-xs font-bold">
                             <span className="text-slate-400 uppercase tracking-widest">Monthly Installment</span>
                             <span className="text-slate-900 font-black tracking-tight">KES {Number(loan.monthlyInstallment).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold">
                             <span className="text-slate-400 uppercase tracking-widest">Remaining Balance</span>
                             <span className="text-rose-600 font-black tracking-tight italic">KES {Number(loan.remainingBalance).toLocaleString()}</span>
                          </div>
                       </div>
                    </div>
                 </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="advances" className="space-y-6">
           <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
              <Table>
                 <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                    <TableRow>
                       <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</TableHead>
                       <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</TableHead>
                       <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</TableHead>
                       <TableHead className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Amount</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {advances.map(a => (
                       <TableRow key={a.id}>
                          <TableCell className="py-6 px-8 font-black text-slate-900">{a.employee.name}</TableCell>
                          <TableCell className="py-6 px-8 text-slate-500 font-bold">{new Date(a.date).toLocaleDateString()}</TableCell>
                          <TableCell className="py-6 px-8">
                             <Badge variant="outline" className="rounded-full font-black text-[9px] uppercase tracking-widest">
                                {a.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="py-6 px-8 text-right font-black text-slate-900 text-lg">
                             KES {Number(a.amount).toLocaleString()}
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

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt, Users, Landmark, Plus } from 'lucide-react';
import Link from 'next/link';

interface FinanceSummary {
  totalIncome: number;
  totalSalaries: number;
  totalExpenses: number;
  netBalance: number;
}

interface FinanceStats {
  summary: FinanceSummary;
  recent: {
    receipts: any[];
    salaries: any[];
    expenses: any[];
  }
}

export default function FinanceDashboard() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/finance/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { summary, recent } = (stats && !('error' in stats)) ? stats : { 
    summary: { totalIncome: 0, totalSalaries: 0, totalExpenses: 0, netBalance: 0 },
    recent: { receipts: [], salaries: [], expenses: [] }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen bg-slate-50/50 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-slate-200">
        <div className="flex items-center gap-5">
           <div className="h-16 w-16 flex items-center justify-center rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20">
              <Landmark className="h-8 w-8" />
           </div>
           <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Institutional Finance</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Treasury & Expenditure Analysis</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
            <Link href="/finance/expenses">
               <ArrowDownRight className="mr-2 h-4 w-4 text-rose-500" />
               Expenses
            </Link>
          </Button>
          <Button asChild className="h-14 px-8 rounded-2xl bg-slate-900 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 transition-all">
            <Link href="/finance/payroll">
               <Users className="mr-2 h-4 w-4 text-emerald-400" />
               Payroll
            </Link>
          </Button>
        </div>
      </div>

      {/* Modern Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="rounded-[3rem] border-none bg-white shadow-sm hover:shadow-2xl transition-all group overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Income</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 transition-colors duration-500">
               <ArrowUpRight className="h-4 w-4 text-emerald-500 group-hover:text-white transition-colors duration-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter text-slate-900">
              {Number(summary.totalIncome || 0).toLocaleString()} <span className="text-xs font-black opacity-30">KES</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Student Fee Collections</p>
          </CardContent>
        </Card>

        <Card className="rounded-[3rem] border-none bg-white shadow-sm hover:shadow-2xl transition-all group overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payroll Cost</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-500">
               <ArrowDownRight className="h-4 w-4 text-orange-500 group-hover:text-white transition-colors duration-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter text-slate-900">
              {Number(summary.totalSalaries || 0).toLocaleString()} <span className="text-xs font-black opacity-30">KES</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Staff Remuneration</p>
          </CardContent>
        </Card>

        <Card className="rounded-[3rem] border-none bg-white shadow-sm hover:shadow-2xl transition-all group overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operating Expenses</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-500 transition-colors duration-500">
               <ArrowDownRight className="h-4 w-4 text-rose-500 group-hover:text-white transition-colors duration-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter text-slate-900">
              {Number(summary.totalExpenses || 0).toLocaleString()} <span className="text-xs font-black opacity-30">KES</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Operational Overheads</p>
          </CardContent>
        </Card>

        <Card className="rounded-[3rem] border-none bg-slate-900 text-white shadow-2xl shadow-slate-900/30 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-110 transition-transform">
             <Wallet className="size-20" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Treasury</CardTitle>
            <Landmark className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className={`text-4xl font-black tracking-tighter ${summary.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {Number(summary.netBalance || 0).toLocaleString()} <span className="text-xs font-black opacity-40">KES</span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Current Fiscal Status</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Recent Ledger - Income */}
        <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-emerald-500/5">
            <div>
              <CardTitle className="text-lg font-black tracking-tight text-slate-900 uppercase italic">Recent Revenue</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Student Tuition Receipts</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
               <Receipt className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="border-none">
                  <TableHead className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Source</TableHead>
                  <TableHead className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.receipts.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-widest opacity-30">No Transactions Detected</TableCell></TableRow>
                ) : (
                  recent.receipts.map((r: any) => (
                    <TableRow key={r.id} className="group hover:bg-slate-50/50 transition-colors border-none">
                      <TableCell className="py-6 px-8">
                         <p className="font-black text-slate-900 text-xs">{r.Payment?.Student?.name || 'Unknown Payer'}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(r.date).toLocaleDateString()}</p>
                      </TableCell>
                      <TableCell className="py-6 px-8 text-right">
                         <span className="text-sm font-black text-emerald-600">KES {Number(r.amount || 0).toLocaleString()}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="p-4 bg-slate-50/50">
               <Button variant="ghost" className="w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white" asChild>
                  <Link href="/receipts">View Full Receipts Ledger</Link>
               </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Ledger - Payroll */}
        <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-orange-500/5">
            <div>
              <CardTitle className="text-lg font-black tracking-tight text-slate-900 uppercase italic">Recent Payroll</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Staff Remuneration Logs</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
               <Users className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="border-none">
                  <TableHead className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel</TableHead>
                  <TableHead className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.salaries.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-widest opacity-30">No Payroll History</TableCell></TableRow>
                ) : (
                  recent.salaries.map((s: any) => (
                    <TableRow key={s.id} className="group hover:bg-slate-50/50 transition-colors border-none">
                      <TableCell className="py-6 px-8">
                         <p className="font-black text-slate-900 text-xs">{s.employee?.name || 'Staff Member'}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {new Date(2000, (s.month || 1) - 1).toLocaleString('default', { month: 'short' })} {s.year}
                         </p>
                      </TableCell>
                      <TableCell className="py-6 px-8 text-right">
                         <span className="text-sm font-black text-orange-600">KES {Number(s.amount || 0).toLocaleString()}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="p-4 bg-slate-50/50">
               <Button variant="ghost" className="w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white" asChild>
                  <Link href="/finance/payroll">Manage Personnel Payroll</Link>
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

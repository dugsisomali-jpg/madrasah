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

  const { summary, recent } = stats || { 
    summary: { totalIncome: 0, totalSalaries: 0, totalExpenses: 0, netBalance: 0 },
    recent: { receipts: [], salaries: [], expenses: [] }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of income and expenditures for this month.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/finance/expenses">Manage Expenses</Link>
          </Button>
          <Button asChild>
            <Link href="/finance/salaries">Manage Salaries</Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              ${summary.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From student fee receipts</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-orange-500/10 to-orange-500/5 dark:from-orange-500/20 dark:to-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salaries Paid</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              ${summary.totalSalaries.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">To staff and teachers</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-rose-500/10 to-rose-500/5 dark:from-rose-500/20 dark:to-rose-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Other Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              ${summary.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Operational costs</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-primary/10 dark:bg-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary.netBalance >= 0 ? 'text-primary' : 'text-rose-600'}`}>
              ${summary.netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Profit/Loss for current month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Income</CardTitle>
              <p className="text-sm text-muted-foreground">Latest student fee payments</p>
            </div>
            <Receipt className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.receipts.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No recent receipts</TableCell></TableRow>
                ) : (
                  recent.receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.Payment?.Student?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-sm">{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">${Number(r.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Button variant="ghost" className="w-full mt-4 text-primary" asChild>
              <Link href="/receipts">View All Receipts</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Salaries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Salaries</CardTitle>
              <p className="text-sm text-muted-foreground">Latest staff salary payments</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month/Year</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.salaries.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No recent salary payments</TableCell></TableRow>
                ) : (
                  recent.salaries.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.employee?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-sm">{s.month}/{s.year}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">${Number(s.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Button variant="ghost" className="w-full mt-4 text-primary" asChild>
              <Link href="/finance/salaries">Manage Salaries</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

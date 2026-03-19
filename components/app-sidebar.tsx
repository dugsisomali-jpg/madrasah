'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  FileCheck,
  Menu,
  Shield,
  Banknote,
  BookMarked,
  Wallet,
  ClipboardCheck,
  Settings2,
  PieChart,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Command Center', icon: LayoutDashboard },
  { href: '/memorization', label: 'Academic Ark', icon: BookMarked, permission: 'memorization.read' },
  { href: '/students', label: 'Protégés', icon: Users, permission: 'students.read' },
  { href: '/employees', label: 'Institutional Staff', icon: GraduationCap, permission: 'employees.read' },
  { href: '/payments', label: 'Revenue Stream', icon: Banknote, permission: 'payments.read' },
  { href: '/receivables', label: 'Financial Dues', icon: Wallet, permission: 'payments.read' },
  { href: '/finance/expenses', label: 'Asset Outflow', icon: PieChart, permission: 'expenses.read' },
  { href: '/finance/payroll-runs', label: 'Payroll Engine', icon: Sparkles, permission: 'hr.manage' },
  { href: '/finance/salary-config', label: 'Remuneration Lab', icon: Settings2, permission: 'hr.manage' },
  { href: '/exams', label: 'Evaluations', icon: FileCheck, permission: 'exams.manage' },
  { href: '/subjects', label: 'Knowledge Base', icon: BookOpen, permission: 'subjects.read' },
  { href: '/attendance', label: 'Presence Matrix', icon: ClipboardCheck, permission: 'attendance.read' },
  { href: '/reports/finance', label: 'Intelligence Reports', icon: PieChart, permission: 'reports.read' },
  { href: '/user-management', label: 'Access Control', icon: Shield, permission: 'users.read' },
  { href: '/settings', label: 'System Settings', icon: Menu, permission: 'system.manage' },
];

function NavLinks({ 
  onLinkClick, 
  permissions 
}: { 
  onLinkClick?: () => void;
  permissions: string[] | null;
}) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => {
    if (!item.permission) return true;
    if (!permissions) return true;
    const target = item.permission.toLowerCase();
    if (permissions.includes('manage.system') || permissions.includes('system.manage')) return true;
    if (permissions.includes(target)) return true;
    if (target.includes('.')) {
      const [resource] = target.split('.');
      if (permissions.includes(`${resource}.manage`)) return true;
    }
    return false;
  });

  return (
    <nav className="flex flex-col gap-1.5 px-3">
      {filteredItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || 
          (href === '/receivables' && pathname.startsWith('/receivables/')) ||
          (href === '/payments' && (pathname.startsWith('/payments/') || pathname.startsWith('/receipts/')));
        
        return (
          <Link
            key={href}
            href={href}
            onClick={() => onLinkClick?.()}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all duration-300 italic-none",
              isActive
                ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.02]"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform",
                isActive ? "text-indigo-400" : "group-hover:scale-110"
              )}
            />
            <span className="flex-1">{label}</span>
            {isActive && <ArrowRight className="size-3 text-white/40 animate-in slide-in-from-left duration-500" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({ 
  user, 
  permissions = null 
}: { 
  user: any;
  permissions?: string[] | null;
}) {
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState('/logo.png');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(settings => {
        if (Array.isArray(settings)) {
          const s = settings.find(s => s.key === 'logo');
          if (s?.value) setLogo(s.value);
        }
      }).catch(() => {});
  }, []);

  return (
    <>
      {/* Desktop Sidebar - Premium Floating Look */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 p-4 lg:flex bg-slate-50/50 italic-none">
        <div className="flex h-full w-full flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
          
          {/* Top Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Logo Section */}
          <div className="shrink-0 px-8 py-10 mt-2">
            <Link href="/" className="block group">
              <div className="relative h-16 w-full transition-transform group-hover:scale-105">
                <img
                  src={logo}
                  alt="Madrasah"
                  className="h-full w-full object-contain object-left pointer-events-none"
                />
              </div>
            </Link>
          </div>

          <div className="shrink-0 px-8 mb-4">
             <div className="h-px bg-slate-50" />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-2 pb-10 custom-scrollbar">
            <p className="mb-4 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
               Navigation Base
            </p>
            <NavLinks permissions={permissions} />
          </div>

          {/* Institutional Stamp - Aesthetic addition */}
          <div className="shrink-0 p-8 bg-slate-50/50 border-t border-slate-50">
             <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                   <Shield className="size-4 text-indigo-500" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-900 uppercase">Legacy Protocol</p>
                   <p className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Secured by Nexus v1</p>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Mobile Trigger & Sidebar */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white border-b border-slate-100 px-6 italic-none">
           <Link href="/">
              <img src={logo} alt="Logo" className="h-8 w-auto" />
           </Link>
           <button
             type="button"
             onClick={() => setOpen(true)}
             className="size-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900 hover:bg-slate-100 transition-colors"
           >
              <Menu className="size-5" />
           </button>
        </header>

        {open && (
          <>
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-[70] flex w-[85%] max-w-sm flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-300 overflow-hidden italic-none">
               <div className="shrink-0 p-8 flex items-center justify-between border-b border-slate-50">
                  <img src={logo} alt="Logo" className="h-10 w-auto" />
                  <button onClick={() => setOpen(false)} className="size-8 rounded-lg bg-slate-50 flex items-center justify-center">
                     <ArrowRight className="size-4 text-slate-400 rotate-180" />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto py-8">
                  <NavLinks onLinkClick={() => setOpen(false)} permissions={permissions} />
               </div>
            </aside>
          </>
        )}
      </div>
    </>
  );
}

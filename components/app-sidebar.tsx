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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/memorization', label: 'Memorization', icon: BookMarked, permission: 'memorization.read' },
  { href: '/students', label: 'Students', icon: Users, permission: 'students.read' },
  { href: '/employees', label: 'Employees', icon: GraduationCap, permission: 'employees.read' },
  { href: '/payments', label: 'Students Payments', icon: Banknote, permission: 'payments.read' },
  { href: '/receivables', label: 'Students Receivables', icon: Wallet, permission: 'payments.read' },
  { href: '/finance', label: 'Finance Dashboard', icon: LayoutDashboard },
  { href: '/finance/salaries', label: 'Salaries', icon: Banknote, permission: 'hr.manage' },
  { href: '/finance/expenses', label: 'Expenses', icon: PieChart, permission: 'expenses.read' },
  { href: '/exams', label: 'Exams', icon: FileCheck, permission: 'exams.manage' },
  { href: '/user-management', label: 'User Management', icon: Shield, permission: 'users.read' },
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
    <nav className="flex flex-col gap-1 px-3">
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
              "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon
              className={cn(
                "size-5 shrink-0 transition-transform",
                isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900 group-hover:scale-105"
              )}
            />
            <span className="flex-1">{label}</span>
            {isActive && <ChevronRight className="size-4 opacity-50 transition-transform group-hover:translate-x-0.5" />}
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
    const fetchLogo = () => {
      fetch('/api/settings')
        .then(r => r.json())
        .then(settings => {
          if (Array.isArray(settings)) {
            const s = settings.find(s => s.key === 'logo');
            if (s?.value) setLogo(s.value);
          }
        }).catch(() => {});
    };

    fetchLogo();
    window.addEventListener('branding-update', fetchLogo);
    return () => window.removeEventListener('branding-update', fetchLogo);
  }, []);

  return (
    <>
      {/* Desktop Sidebar - Standard Flush Look */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-100 bg-white lg:flex lg:shadow-sm">
        {/* Logo Section */}
        <div className="shrink-0 px-8 py-8 border-b border-slate-50 mb-6">
          <Link href="/" className="block">
            <img
              src={logo}
              alt="Madrasah"
              className="h-10 w-auto object-contain object-left pointer-events-none"
            />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
          <p className="mb-4 px-7 text-[10px] font-bold uppercase tracking-widest text-slate-400">
             Main Menu
          </p>
          <NavLinks permissions={permissions} />
        </div>

        {/* Institutional Stamp */}
        <div className="shrink-0 p-6 bg-slate-50/50 border-t border-slate-100">
           <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                 <Shield className="size-5 text-indigo-500" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-900 uppercase leading-none">Institutional System</p>
                 <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">Version 1.5.0</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Mobile Trigger & Sidebar */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white border-b border-slate-100 px-6">
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
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-[70] flex w-64 flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-300">
               <div className="shrink-0 p-8 flex items-center justify-between border-b border-slate-100">
                  <img src={logo} alt="Logo" className="h-10 w-auto" />
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  FileCheck,
  Menu,
  LogOut,
  Shield,
  Banknote,
  BookMarked,
  Wallet,
  ClipboardCheck,
  Settings2,
  FileText,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useEffect, useState as useReactState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/memorization', label: 'Memorization', icon: BookOpen, permission: 'memorization.read' },
  { href: '/students', label: 'Students', icon: Users, permission: 'students.read' },
  { href: '/employees', label: 'Employees', icon: GraduationCap, permission: 'employees.read' },
  { href: '/payments', label: 'Payments', icon: Banknote, permission: 'payments.read' },
  { href: '/receivables', label: 'Receivables', icon: Wallet, permission: 'payments.read' },
  { href: '/finance/expenses', label: 'Expenses', icon: Wallet, permission: 'expenses.read' },
  { href: '/finance/payroll-runs', label: 'Payroll Engine', icon: Banknote, permission: 'hr.manage' },
  { href: '/finance/salary-config', label: 'Salary Config', icon: Settings2, permission: 'hr.manage' },
  { href: '/my-payslips', label: 'My Payslips', icon: FileText },
  { href: '/exams', label: 'Exams', icon: FileCheck, permission: 'exams.manage' },
  { href: '/subjects', label: 'Subjects', icon: BookMarked, permission: 'subjects.read' },
  { href: '/attendance', label: 'Attendance', icon: ClipboardCheck, permission: 'attendance.read' },
  { href: '/reports/finance', label: 'Reports', icon: LayoutDashboard, permission: 'reports.read' },
  { href: '/user-management', label: 'User Management', icon: Shield, permission: 'users.read' },
  { href: '/settings', label: 'Settings', icon: Menu, permission: 'system.manage' },
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
    if (!permissions) return true; // Show all if permissions not loaded (to avoid flickering)

    const target = item.permission.toLowerCase();
    if (permissions.includes('manage.system') || permissions.includes('system.manage')) return true;
    if (permissions.includes(target)) return true;

    // Pattern matching
    if (target.includes('.')) {
      const [resource] = target.split('.');
      if (permissions.includes(`${resource}.manage`)) return true;
    }

    return false;
  });

  return (
    <nav className="flex flex-col gap-1">
      {filteredItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || 
          (href === '/receivables' && (pathname === '/receivables' || pathname.startsWith('/receivables/'))) ||
          (href === '/payments' && (pathname === '/payments' || pathname.startsWith('/payments/') || pathname.startsWith('/receipts/')));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => onLinkClick?.()}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            <Icon
              className={`size-5 shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-105'}`}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  className,
  onLinkClick,
  user,
  permissions,
}: {
  className?: string;
  onLinkClick?: () => void;
  user?: { username?: string } | null;
  permissions: string[] | null;
}) {
  return (
    <div className={`flex h-full flex-col ${className ?? ''}`}>
      {/* Logo / brand - fitted to full width */}
      <div className="shrink-0 px-2 py-3">
        <Link
          href="/"
          onClick={onLinkClick}
          className="block w-full rounded-xl bg-primary/5 transition-colors hover:bg-primary/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Madrasah"
            className="h-auto w-full object-contain object-center"
          />
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        <NavLinks onLinkClick={onLinkClick} permissions={permissions} />
      </div>

      {/* User & sign out */}
      <div className="shrink-0 space-y-1 border-t border-border/60 p-4">
        {user?.username && (
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium">{user.username}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AppSidebar({ 
  user, 
  permissions = null 
}: { 
  user: { username?: string } | null;
  permissions?: string[] | null;
}) {
  const [open, setOpen] = useReactState(false);
  const [logo, setLogo] = useReactState('/logo.png');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(settings => {
        if (Array.isArray(settings)) {
          const logoSetting = settings.find(s => s.key === 'logo');
          if (logoSetting?.value) setLogo(logoSetting.value);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-card lg:flex lg:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.08)]">
        <div className={`flex h-full flex-col`}>
          {/* Logo / brand - fitted to full width */}
          <div className="shrink-0 px-2 py-3">
            <Link
              href="/"
              className="block w-full rounded-xl bg-primary/5 transition-colors hover:bg-primary/10"
            >
              <img
                src={logo}
                alt="Madrasah"
                className="h-auto w-full object-contain object-center max-h-20"
              />
            </Link>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
            <NavLinks permissions={permissions} />
          </div>

          {/* User & sign out */}
          <div className="shrink-0 space-y-1 border-t border-border/60 p-4">
            {user?.username && (
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="truncate text-sm font-medium">{user.username}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile: header + slide-out */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/60 bg-card px-4 shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="relative flex h-10 w-24 shrink-0" aria-label="Madrasah">
          <Image
            src={logo}
            alt="Madrasah"
            fill
            className="object-contain object-left"
            sizes="96px"
          />
        </Link>
        {user && (
          <span className="ml-auto truncate text-sm text-muted-foreground">{user.username}</span>
        )}
      </header>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/60 bg-card shadow-2xl transition-transform lg:hidden">
             <div className={`flex h-full flex-col`}>
                <div className="shrink-0 px-2 py-3">
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="block w-full rounded-xl bg-primary/5 transition-colors hover:bg-primary/10"
                  >
                    <img
                      src={logo}
                      alt="Madrasah"
                      className="h-auto w-full object-contain object-center max-h-20"
                    />
                  </Link>
                </div>
                <div className="flex-1 overflow-auto px-4 pb-4">
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Menu
                  </p>
                  <NavLinks onLinkClick={() => setOpen(false)} permissions={permissions} />
                </div>
             </div>
          </aside>
        </>
      )}
    </>
  );
}

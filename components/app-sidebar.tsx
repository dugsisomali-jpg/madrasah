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
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const navItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/memorization', label: 'Memorization', icon: BookOpen },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/teachers', label: 'Teachers', icon: GraduationCap },
  { href: '/payments', label: 'Payments', icon: Banknote },
  { href: '/receivables', label: 'Receivables', icon: Wallet },
  { href: '/exams', label: 'Exams', icon: FileCheck },
  { href: '/subjects', label: 'Subjects', icon: BookMarked },
  { href: '/user-management', label: 'User Management', icon: Shield },
];

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href === '/receivables' && pathname.startsWith('/receivables/'));
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
}: {
  className?: string;
  onLinkClick?: () => void;
  user?: { username?: string } | null;
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
        <NavLinks onLinkClick={onLinkClick} />
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

export function AppSidebar({ user }: { user: { username?: string } | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-card lg:flex lg:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.08)]">
        <SidebarContent user={user} />
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
            src="/logo.png"
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
            <SidebarContent user={user} onLinkClick={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function ParentLayout({
  user,
  children,
}: {
  user: { username?: string; name?: string | null } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [logo, setLogo] = useState('/logo.png');

  const fetchBranding = () => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(settings => {
        if (Array.isArray(settings)) {
          const s = settings.find(s => s.key === 'logo');
          if (s?.value) setLogo(s.value);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchBranding();
    window.addEventListener('branding-update', fetchBranding);
    return () => window.removeEventListener('branding-update', fetchBranding);
  }, []);

  useEffect(() => {
    if (pathname && pathname !== '/parent') {
      router.replace('/parent');
    }
  }, [pathname, router]);

  if (pathname && pathname !== '/parent') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 italic-none">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white border-b border-slate-100 px-6 sm:px-10 shadow-sm">
        <Link href="/parent" className="flex items-center gap-4 group">
          <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-transform group-hover:scale-105 overflow-hidden p-1">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 leading-none mb-1">Parent Portal</p>
             <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-none">My Children</h1>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          {user && (
            <div className="hidden sm:flex flex-col items-end px-2">
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1.5">Authorized Account</p>
               <span className="text-xs font-black text-slate-900 leading-none">
                 {user.name || user.username}
               </span>
            </div>
          )}
          <div className="h-8 w-px bg-slate-100 hidden sm:block" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 border border-slate-100"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </header>
      <main className="p-6 lg:p-10">
        <div className="min-h-[calc(100vh-10rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}

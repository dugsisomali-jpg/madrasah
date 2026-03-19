'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
    <div className="min-h-screen bg-slate-50/50 italic-none">
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-6 sm:px-10">
        <Link href="/parent" className="flex items-center gap-4 group">
          <div className="size-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20 transition-transform group-hover:scale-105">
            <Image src="/logo.png" alt="" width={32} height={32} className="object-contain" />
          </div>
          <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 leading-none mb-1">Guardian Portal</p>
             <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase italic leading-none">My Children</h1>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          {user && (
            <div className="hidden sm:flex flex-col items-end">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-none mb-1.5">Authorized User</p>
               <span className="text-xs font-black text-slate-900 leading-none">
                 {user.name || user.username}
               </span>
            </div>
          )}
          <div className="h-8 w-px bg-slate-100 hidden sm:block" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 bg-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </header>
      <main className="p-4 lg:p-10">
        <div className="bg-white/40 backdrop-blur-sm rounded-[3rem] border border-white/20 min-h-[calc(100vh-10rem)] shadow-2xl shadow-slate-200/50 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

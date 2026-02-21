'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { BookMarked, LogOut } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border/60 bg-card px-4 shadow-sm sm:px-6">
        <Link href="/parent" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookMarked className="size-4" />
          </div>
          <span className="font-semibold">My Children</span>
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.name || user.username}
            </span>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </header>
      <main className="px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}

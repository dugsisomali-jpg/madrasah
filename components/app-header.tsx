'use client';

import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/memorization': 'Memorization',
  '/students': 'Students',
  '/teachers': 'Teachers',
  '/payments': 'Payments',
  '/exams': 'Exams',
  '/subjects': 'Subjects',
  '/user-management': 'User Management',
  '/parent': 'My Children',
};

function getPageTitle(pathname: string): string {
  if (pathname in routeTitles) return routeTitles[pathname];
  if (pathname.startsWith('/students/')) return 'Student Details';
  if (pathname.startsWith('/payments/')) return 'Payment Detail';
  const segment = pathname.slice(1).split('/')[0];
  if (segment) return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return 'Madrasah';
}

export function AppHeader({ user }: { user: { username?: string } | null }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 lg:px-8">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 md:flex">
            <User className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{user.username}</span>
          </div>
        )}
      </div>
    </header>
  );
}

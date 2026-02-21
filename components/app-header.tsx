'use client';

import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

const routeTitleKeys: Record<string, string> = {
  '/': 'nav.dashboard',
  '/memorization': 'nav.memorization',
  '/students': 'nav.students',
  '/teachers': 'nav.teachers',
  '/payments': 'nav.payments',
  '/exams': 'nav.exams',
  '/subjects': 'nav.subjects',
  '/user-management': 'nav.userManagement',
  '/parent': 'nav.myChildren',
};

function getPageTitleKey(pathname: string): string | null {
  if (pathname in routeTitleKeys) return routeTitleKeys[pathname];
  return null;
}

export function AppHeader({ user }: { user: { username?: string } | null }) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();
  const titleKey = getPageTitleKey(pathname);
  const title = titleKey ? t(titleKey) : (pathname.startsWith('/students/') ? 'Student Details' : pathname.slice(1).split('/')[0]?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Madrasah');

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 lg:px-8">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-input bg-muted/30 p-0.5">
          {(['en', 'ar'] as Locale[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${locale === loc ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {loc === 'en' ? 'EN' : 'العربية'}
            </button>
          ))}
        </div>
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

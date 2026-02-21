'use client';

import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from 'react';

export type Locale = 'en' | 'ar';

const COOKIE_NAME = 'madrasah-locale';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.memorization': 'Memorization',
    'nav.students': 'Students',
    'nav.teachers': 'Teachers',
    'nav.payments': 'Payments',
    'nav.exams': 'Exams',
    'nav.subjects': 'Subjects',
    'nav.userManagement': 'User Management',
    'nav.myChildren': 'My Children',
    'nav.menu': 'Menu',
    'nav.signOut': 'Sign out',
    'nav.signedInAs': 'Signed in as',
    'common.loading': 'Loading…',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
    'subjects.title': 'Subjects',
    'subjects.description': 'Manage subjects for exams and grading.',
    'subjects.create': 'Create subject',
    'subjects.name': 'Name (English)',
    'subjects.nameAr': 'Name (Arabic)',
    'subjects.descriptionLabel': 'Description',
    'subjects.noSubjects': 'No subjects yet. Create one to use in exams.',
    'subjects.created': 'Subject created.',
    'subjects.edit': 'Edit subject',
    'subjects.deleteConfirm': 'Delete this subject? Exam results linked to it will keep the subject name but the subject will be removed from the list.',
  },
  ar: {
    'nav.dashboard': 'لوحة التحكم',
    'nav.memorization': 'الحفظ',
    'nav.students': 'الطلاب',
    'nav.teachers': 'المعلمون',
    'nav.payments': 'المدفوعات',
    'nav.exams': 'الامتحانات',
    'nav.subjects': 'المواد',
    'nav.userManagement': 'إدارة المستخدمين',
    'nav.myChildren': 'أبنائي',
    'nav.menu': 'القائمة',
    'nav.signOut': 'تسجيل الخروج',
    'nav.signedInAs': 'مسجل الدخول باسم',
    'common.loading': 'جاري التحميل…',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.add': 'إضافة',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.close': 'إغلاق',
    'subjects.title': 'المواد',
    'subjects.description': 'إدارة المواد للامتحانات والتقييم.',
    'subjects.create': 'إنشاء مادة',
    'subjects.name': 'الاسم (بالإنجليزية)',
    'subjects.nameAr': 'الاسم (بالعربية)',
    'subjects.descriptionLabel': 'الوصف',
    'subjects.noSubjects': 'لا توجد مواد بعد. أنشئ مادة لاستخدامها في الامتحانات.',
    'subjects.created': 'تم إنشاء المادة.',
    'subjects.edit': 'تعديل المادة',
    'subjects.deleteConfirm': 'حذف هذه المادة؟ نتائج الامتحانات المرتبطة ستبقى باسم المادة لكن المادة ستُزال من القائمة.',
  },
};

function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return value === 'ar' ? 'ar' : 'en';
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getLocaleFromCookie());
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setLocaleCookie(next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next === 'ar' ? 'ar' : 'en';
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale, mounted]);

  const t = useCallback(
    (key: string) => {
      return translations[locale][key] ?? translations.en[key] ?? key;
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: 'en' as Locale,
      setLocale: (_: Locale) => {},
      t: (key: string) => translations.en[key] ?? key,
      dir: 'ltr' as const,
    };
  }
  return ctx;
}

/** Get display name for a subject based on current locale (nameAr when ar, else name). */
export function useSubjectName(subject: { name: string; nameAr?: string | null } | null) {
  const { locale } = useI18n();
  if (!subject) return '';
  if (locale === 'ar' && subject.nameAr?.trim()) return subject.nameAr.trim();
  return subject.name;
}

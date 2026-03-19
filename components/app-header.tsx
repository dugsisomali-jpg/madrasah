'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  FileText, 
  Settings, 
  Search,
  LayoutGrid
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const routeTitles: Record<string, string> = {
  '/': 'Control Center',
  '/memorization': 'Academic Archives',
  '/students': 'Student Registry',
  '/teachers': 'Faculty Directory',
  '/employees': 'Institutional Personnel',
  '/payments': 'Financial Ledger',
  '/receivables': 'Account Receivables',
  '/finance/expenses': 'Expenditure Tracking',
  '/finance/payroll-runs': 'Payroll Intelligence',
  '/finance/salary-config': 'Compensation Architect',
  '/my-payslips': 'Personal Ledger',
  '/exams': 'Assessment Hub',
  '/subjects': 'Curriculum Framework',
  '/user-management': 'Security & Access',
  '/settings': 'System Genesis',
};

function getPageTitle(pathname: string): string {
  if (pathname in routeTitles) return routeTitles[pathname];
  if (pathname.startsWith('/students/')) return 'Scholar Profile';
  if (pathname.startsWith('/payments/')) return 'Transaction Detail';
  if (pathname.startsWith('/receivables/')) return 'Dues Analysis';
  const segment = pathname.slice(1).split('/')[0];
  if (segment) return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return 'Institute';
}

export function AppHeader({ user }: { user: any }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-6 bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-6 sm:px-10 italic-none">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 leading-none mb-1.5">Portal Hub</p>
           <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase italic leading-none">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Bar - Aesthetic addition */}
        <div className="hidden xl:flex items-center relative group">
           <Search className="absolute left-4 size-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
           <input 
             placeholder="Search Nexus..." 
             className="bg-slate-50/50 border border-transparent focus:border-indigo-100 hover:bg-slate-50 rounded-2xl py-2.5 pl-11 pr-6 text-xs font-bold w-64 outline-none transition-all"
           />
        </div>

        <div className="h-8 w-px bg-slate-100 hidden sm:block" />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
           <button 
             onClick={() => setIsOpen(!isOpen)}
             className={cn(
               "flex items-center gap-3 p-1.5 pr-4 rounded-2xl transition-all active:scale-95 group",
               isOpen ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" : "bg-slate-50 hover:bg-slate-100 text-slate-600"
             )}
           >
              <div className={cn(
                "size-10 rounded-[1.15rem] flex items-center justify-center font-black text-sm transition-colors",
                isOpen ? "bg-indigo-500 text-white" : "bg-white text-slate-400 shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-500"
              )}>
                 {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="hidden lg:flex flex-col items-start translate-y-[-1px]">
                 <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Session</span>
                 <span className="text-xs font-bold truncate max-w-[100px] leading-none mt-1">{user?.username || 'Admin'}</span>
              </div>
              <ChevronDown className={cn("size-3.5 transition-transform opacity-40 group-hover:opacity-100", isOpen && "rotate-180 opacity-100")} />
           </button>

           {isOpen && (
             <div className="absolute right-0 mt-4 w-64 bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-900/10 p-4 animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="px-4 py-4 mb-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Authenticity verified</p>
                   <p className="text-sm font-black text-slate-800 tracking-tight">{user?.username}</p>
                   {user?.email && <p className="text-[10px] font-bold text-slate-400 truncate">{user.email}</p>}
                </div>
                
                <div className="space-y-1">
                   <Link 
                     href="/settings"
                     onClick={() => setIsOpen(false)}
                     className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                   >
                      <Settings className="size-4 opacity-40" />
                      Configuration
                   </Link>
                   <Link 
                     href="/my-payslips"
                     onClick={() => setIsOpen(false)}
                     className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                   >
                      <FileText className="size-4 opacity-40" />
                      My Personal Slips
                   </Link>
                   
                   <div className="h-px bg-slate-50 my-2 mx-4" />
                   
                   <button 
                     onClick={() => signOut({ callbackUrl: '/login' })}
                     className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors"
                   >
                      <LogOut className="size-4 opacity-70" />
                      Terminate Session
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </header>
  );
}

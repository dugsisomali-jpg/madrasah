'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  BookOpen, 
  FileCheck, 
  Banknote, 
  ClipboardCheck, 
  ChevronRight, 
  Star, 
  Calendar,
  AlertCircle,
  TrendingDown,
  User,
  GraduationCap,
  Clock,
  Settings,
  LogOut,
  Search,
  LayoutDashboard
} from 'lucide-react';
import { Image, ImageKitProvider } from '@imagekit/next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

type Child = {
  id: string;
  name: string;
  motherName?: string | null;
  imagePath?: string | null;
  teacher?: { name?: string | null; username: string } | null;
};

type MemoRecord = {
  id: string;
  date: string;
  memorizationType: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  rating?: number | null;
  notes?: string | null;
};

type ExamResult = {
  id: string;
  date: string;
  examType: string;
  term: string;
  marks: number;
  maxMarks: number;
  Subject?: { name: string };
};

type Payment = {
  id: string;
  month: number;
  year: number;
  totalDue: number | string;
  discount?: number | string;
  amountPaid: number | string;
};

type AttendanceRecord = {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string | null;
};

type ChildData = {
  memo: MemoRecord[];
  exams: ExamResult[];
  payments: Payment[];
  attendance: AttendanceRecord[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function n(v: unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

export function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [childData, setChildData] = useState<Record<string, ChildData>>({});
  const loadedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/parent/children')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setChildren(list);
        if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
      })
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  const loadChildData = useCallback(async (childId: string) => {
    if (loadedIds.current.has(childId)) return;
    loadedIds.current.add(childId);
    
    try {
      const [memoRes, examsRes, paymentsRes, attendanceRes] = await Promise.all([
        fetch(`/api/memorization?studentId=${childId}&limit=50`),
        fetch(`/api/exams?studentId=${childId}`),
        fetch(`/api/payments?studentId=${childId}&perPage=50`),
        fetch(`/api/attendance?studentId=${childId}`)
      ]);
      
      const memoData = await memoRes.json();
      const examsData = await examsRes.json();
      const paymentsData = await paymentsRes.json();
      const attendanceData = await attendanceRes.json();
      
      setChildData((prev) => ({
        ...prev,
        [childId]: {
          memo: memoData?.data ?? memoData ?? [],
          exams: Array.isArray(examsData) ? examsData : [],
          payments: paymentsData?.payments ?? [],
          attendance: Array.isArray(attendanceData) ? attendanceData : [],
        },
      }));
    } catch (err) {
      console.error('Failed to load child data', err);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadChildData(selectedId);
  }, [selectedId, loadChildData]);

  if (loading) return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50/50">
      <div className="w-full lg:w-80 border-r bg-white p-6 space-y-6 flex flex-col h-screen sticky top-0">
        <div className="flex items-center justify-between mb-4">
           <Skeleton className="h-8 w-32" />
           <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-44 w-full rounded-[2.5rem]" />
        <Skeleton className="h-44 w-full rounded-[2.5rem]" />
      </div>
      <div className="flex-1 p-10 lg:p-20 space-y-10">
        <Skeleton className="h-16 w-1/2 rounded-2xl" />
        <Skeleton className="h-[600px] w-full rounded-[4rem]" />
      </div>
    </div>
  );

  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-slate-50">
        <div className="rounded-[4rem] border border-slate-100 bg-white p-20 text-center shadow-2xl shadow-slate-200/50 max-w-lg animate-in zoom-in duration-500">
          <div className="h-24 w-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
             <User className="h-12 w-12 text-indigo-300" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Access Denied</h3>
          <p className="text-slate-400 mt-6 font-bold text-sm leading-relaxed uppercase tracking-[0.2em] opacity-60">We couldn't find any students linked to your account. Access to the portal is restricted to active parents.</p>
          <Button variant="outline" className="mt-12 rounded-2xl px-10 h-14 font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-slate-50 group transition-all" onClick={() => signOut()}>
             <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const selectedChild = children.find((c) => c.id === selectedId) || children[0];
  const data = childData[selectedId || ''] || null;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FDFDFE] overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Information-Rich Left Sidebar */}
      <aside className="w-full lg:w-[420px] shrink-0 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 shadow-2xl shadow-slate-200/10 z-20">
        <div className="p-10 pb-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">
                 <LayoutDashboard className="text-white size-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mb-1.5">Family Hub</p>
                 <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">My Children</h2>
              </div>
           </div>
           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-900 border border-slate-100" asChild>
              <a href="/settings">
                 <Settings className="h-5 w-5" />
              </a>
           </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6 custom-scrollbar">
           {children.map((child) => {
              const cData = childData[child.id];
              const attRate = cData ? (cData.attendance.filter(r => r.status === 'PRESENT').length / Math.max(1, cData.attendance.length) * 100).toFixed(0) : '—';
              const acScore = cData && cData.exams.length > 0 ? (cData.exams.reduce((sum, e) => sum + (e.marks / e.maxMarks), 0) / cData.exams.length * 100).toFixed(0) : '—';
              const balance = cData ? cData.payments.reduce((sum, p) => sum + (n(p.totalDue) - n(p.discount) - n(p.amountPaid)), 0) : null;

              const isSelected = selectedId === child.id;

              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedId(child.id)}
                  className={`w-full group text-left rounded-[3rem] p-6 transition-all duration-700 border-2 ${
                    isSelected 
                      ? 'bg-white border-indigo-600 shadow-2xl shadow-indigo-600/10 scale-[1.03]' 
                      : 'bg-[#F9FAFB] border-transparent hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-5 mb-6">
                     <div className={`h-16 w-16 rounded-[1.5rem] p-0.5 shadow-xl transition-all duration-700 group-hover:rotate-3 ${isSelected ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className="h-full w-full rounded-[1.4rem] bg-white overflow-hidden">
                           {child.imagePath && urlEndpoint ? (
                             <Image
                               src={child.imagePath.startsWith('/') ? child.imagePath : `/${child.imagePath}`}
                               width={70}
                               height={70}
                               alt={child.name}
                               className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                             />
                           ) : (
                             <div className="h-full w-full flex items-center justify-center bg-slate-50 text-2xl font-black text-slate-300">
                               {child.name.charAt(0)}
                             </div>
                           )}
                        </div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className={`font-black text-base truncate tracking-tight uppercase italic leading-none ${isSelected ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                           {child.name}
                        </h3>
                        <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5 ${isSelected ? 'text-indigo-400' : ''}`}>
                           <Star className={`size-3 ${isSelected ? 'fill-indigo-400' : ''}`} /> Student Member
                        </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                     <div className={`rounded-2xl p-3 border transition-all duration-500 ${isSelected ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'bg-white border-slate-100'}`}>
                        <p className="text-[12px] font-black text-slate-900 tracking-tighter leading-none">{attRate}%</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60">Attend</p>
                     </div>
                     <div className={`rounded-2xl p-3 border transition-all duration-500 ${isSelected ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' : 'bg-white border-slate-100'}`}>
                        <p className="text-[12px] font-black text-slate-900 tracking-tighter leading-none">{acScore}%</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60">Grade</p>
                     </div>
                     <div className={`rounded-2xl p-3 border transition-all duration-500 ${isSelected ? (balance && balance > 0 ? 'bg-rose-50/50 border-rose-100 shadow-sm' : 'bg-slate-50/50 border-slate-100') : 'bg-white border-slate-100'}`}>
                        <p className={`text-[12px] font-black tracking-tighter leading-none ${balance && balance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                           {balance !== null ? (balance / 1000).toFixed(1) + 'k' : '—'}
                        </p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60">Balance</p>
                     </div>
                  </div>
                </button>
              );
           })}
        </div>
        
        <div className="p-10 border-t border-slate-100 bg-[#F9FAFB]">
           <Button variant="ghost" className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:text-rose-600 transition-all hover:bg-white border border-transparent hover:border-slate-200" onClick={() => signOut()}>
              <LogOut className="mr-3 h-5 w-5" /> Terminate Session
           </Button>
        </div>
      </aside>

      {/* Modern Content Area */}
      <main className="flex-1 min-h-screen overflow-y-auto p-10 lg:p-24 animate-in fade-in slide-in-from-right-8 duration-1000">
         <div className="max-w-6xl mx-auto space-y-14">
            {/* Minimalist Profile Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <span className="h-10 px-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        Academic Profile
                     </span>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Integrated ID: {selectedChild.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <h1 className="text-6xl font-black text-slate-900 tracking-tighter sm:text-7xl uppercase italic leading-none">{selectedChild.name}</h1>
                  {selectedChild.teacher && (
                    <div className="flex items-center gap-4 mt-8 bg-white border border-slate-100 rounded-3xl p-4 pr-8 w-fit shadow-xl shadow-slate-200/20">
                       <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                          <GraduationCap className="h-7 w-7" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Mentor & Instructor</p>
                          <p className="text-base font-black text-slate-900 uppercase italic">{selectedChild.teacher.name || selectedChild.teacher.username}</p>
                       </div>
                    </div>
                  )}
               </div>

               <div className="hidden xl:flex flex-col items-end gap-3 text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Digital Parent Signature Verified</p>
                  <p className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-1">Madrasah Academic Archive v1.5</p>
               </div>
            </div>

            {/* Detailed Ledger & Data Sections */}
            <section className="bg-white rounded-[5rem] border border-slate-100 shadow-2xl shadow-indigo-900/[0.03] overflow-hidden min-h-[700px] flex flex-col transition-all duration-700 hover:shadow-indigo-900/[0.05]">
              {!data ? (
                <div className="flex-1 flex flex-col items-center justify-center p-32 space-y-8">
                   <div className="relative h-24 w-24">
                      <div className="absolute inset-0 border-8 border-indigo-100 rounded-full" />
                      <div className="absolute inset-0 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                   </div>
                   <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] animate-pulse">Establishing Secure Stream...</p>
                </div>
              ) : (
                <Tabs defaultValue="attendance" className="flex-1 flex flex-col">
                  <div className="px-16 pt-16 border-b border-slate-50">
                    <TabsList className="w-full flex h-auto p-2 bg-[#F9FAFB] rounded-[3rem] gap-2 border border-slate-100 shadow-inner">
                      <TabsTrigger value="attendance" className="flex-1 py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-indigo-600 transition-all duration-500">
                        <ClipboardCheck className="size-5 mr-3" /> Attendance
                      </TabsTrigger>
                      <TabsTrigger value="memorization" className="flex-1 py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-indigo-600 transition-all duration-500">
                        <BookOpen className="size-5 mr-3" /> Memorization
                      </TabsTrigger>
                      <TabsTrigger value="exams" className="flex-1 py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-indigo-600 transition-all duration-500">
                        <FileCheck className="size-5 mr-3" /> Academics
                      </TabsTrigger>
                      <TabsTrigger value="fees" className="flex-1 py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-indigo-600 transition-all duration-500">
                        <Banknote className="size-5 mr-3" /> Financial
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <TabsContent value="memorization" className="p-0 animate-in fade-in slide-in-from-bottom-5 duration-700">
                      <div className="p-16">
                        {data.memo.length === 0 ? (
                          <EmptyData icon={<BookOpen />} text="Encrypted record not found." />
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-none bg-[#F9FAFB]">
                                  <TableHead className="rounded-l-[3rem] py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Log Date</TableHead>
                                  <TableHead className="py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Category</TableHead>
                                  <TableHead className="py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Surah ID</TableHead>
                                  <TableHead className="py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Verse Range</TableHead>
                                  <TableHead className="rounded-r-[3rem] py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Progress</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.memo.map((r) => (
                                  <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                    <TableCell className="py-10 px-12">
                                       <span className="font-black text-slate-500 text-sm italic">{new Date(r.date).toLocaleDateString()}</span>
                                    </TableCell>
                                    <TableCell className="py-10 px-12">
                                       <Badge variant="outline" className="bg-indigo-50/50 border-indigo-100 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] px-5 h-9 rounded-2xl">
                                          {r.memorizationType}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="py-10 px-12 font-black text-slate-900 text-2xl tracking-tighter uppercase italic opacity-80">Surah {r.surahNumber}</TableCell>
                                    <TableCell className="py-10 px-12 font-black text-slate-400 uppercase text-[12px] tracking-widest">{r.ayahStart} <ArrowRight className="inline mx-2 size-3 opacity-30" /> {r.ayahEnd}</TableCell>
                                    <TableCell className="py-10 px-12 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`size-4 ${i < (r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-100'}`} />
                                          ))}
                                       </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="exams" className="p-0 animate-in fade-in slide-in-from-bottom-5 duration-700">
                      <div className="p-16">
                        {data.exams.length === 0 ? (
                          <EmptyData icon={<FileCheck />} text="Assessment cycle incomplete." />
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-none bg-[#F9FAFB]">
                                  <TableHead className="rounded-l-[3rem] py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Cycle</TableHead>
                                  <TableHead className="py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Discipline</TableHead>
                                  <TableHead className="py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Strategy</TableHead>
                                  <TableHead className="rounded-r-[3rem] py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Result</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.exams.map((e) => (
                                  <TableRow key={e.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                    <TableCell className="py-10 px-12">
                                       <p className="font-black text-slate-900 text-sm mb-1 uppercase tracking-tighter italic">{e.term}</p>
                                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">{new Date(e.date).toLocaleDateString()}</p>
                                    </TableCell>
                                    <TableCell className="py-10 px-12 font-black text-slate-700 text-base tracking-tight uppercase">{e.Subject?.name || '—'}</TableCell>
                                    <TableCell className="py-10 px-12">
                                       <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-5 h-9 rounded-2xl">
                                          {e.examType.replace(/_/g, ' ')}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="py-10 px-12 text-right">
                                       <span className="text-3xl font-black text-slate-900 tracking-tighter">{e.marks}</span>
                                       <span className="text-[12px] font-black text-slate-200 ml-3 uppercase tracking-[0.3em]">of {e.maxMarks}</span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="attendance" className="p-0 animate-in fade-in slide-in-from-bottom-5 duration-700">
                      <div className="p-16">
                        {data.attendance.length === 0 ? (
                          <EmptyData icon={<ClipboardCheck />} text="Attendance log empty." />
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                            {data.attendance.map((r) => (
                              <div key={r.id} className="p-10 rounded-[3.5rem] border border-slate-100 bg-white shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-700 flex items-center justify-between group">
                                 <div>
                                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">{new Date(r.date).getFullYear()}</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                                 </div>
                                 <Badge 
                                    variant="outline" 
                                    className={`rounded-[1.5rem] h-12 flex items-center justify-center font-black text-[10px] uppercase tracking-[0.3em] px-6 shadow-xl transition-all duration-700 ${
                                       r.status === 'PRESENT' ? 'bg-emerald-600 text-white border-none shadow-emerald-900/20' :
                                       r.status === 'ABSENT' ? 'bg-rose-600 text-white border-none shadow-rose-900/20' :
                                       'bg-amber-500 text-white border-none shadow-amber-900/20'
                                    }`}
                                 >
                                    {r.status}
                                 </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="fees" className="p-0 animate-in fade-in slide-in-from-bottom-5 duration-700">
                      <div className="p-16">
                        {data.payments.length === 0 ? (
                          <EmptyData icon={<Banknote />} text="No financial entries found." />
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-none bg-[#F9FAFB]">
                                  <TableHead className="rounded-l-[3rem] py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Statement Detail</TableHead>
                                  <TableHead className="py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Invoiced</TableHead>
                                  <TableHead className="py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Processed</TableHead>
                                  <TableHead className="rounded-r-[3rem] py-8 px-12 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Account Integrity</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.payments.map((p) => {
                                  const balance = n(p.totalDue) - n(p.discount) - n(p.amountPaid);
                                  return (
                                    <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                      <TableCell className="py-10 px-12">
                                         <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-indigo-300 text-sm italic shadow-inner">
                                               {MONTHS[p.month - 1].slice(0, 3).toUpperCase()}
                                            </div>
                                            <div>
                                               <p className="font-black text-slate-900 text-lg uppercase tracking-tighter italic leading-none mb-1">{MONTHS[p.month - 1]} {p.year}</p>
                                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-60">System Ledger Entry</p>
                                            </div>
                                         </div>
                                      </TableCell>
                                      <TableCell className="py-10 px-12 text-right font-black text-slate-400 text-base tracking-tighter">
                                         {n(p.totalDue).toLocaleString()} <span className="text-[10px] opacity-40 ml-1.5 uppercase">KES</span>
                                      </TableCell>
                                      <TableCell className="py-10 px-12 text-right font-black text-emerald-600 text-base tracking-tighter">
                                         {n(p.amountPaid).toLocaleString()} <span className="text-[10px] opacity-40 ml-1.5 uppercase">KES</span>
                                      </TableCell>
                                      <TableCell className="py-10 px-12 text-right">
                                         <Badge className={`rounded-[1.5rem] h-11 flex items-center justify-center font-black text-[10px] uppercase tracking-[0.2em] px-8 border-none ${balance > 0 ? 'bg-rose-50 text-rose-600 shadow-none' : 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30'}`}>
                                            {balance > 0 ? `DEBT: ${balance.toLocaleString()} KES` : 'VERIFIED / CLEARED'}
                                         </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              )}
            </section>
         </div>
      </main>
    </div>
  );
}

function EmptyData({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="py-48 text-center space-y-10 opacity-20 group">
       <div className="mx-auto size-32 rounded-[4rem] bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-1000 shadow-inner">
          <div className="scale-[2.5] text-slate-900">
             {icon}
          </div>
       </div>
       <p className="text-[12px] font-black text-slate-900 uppercase tracking-[1em] whitespace-nowrap overflow-hidden">{text}</p>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}

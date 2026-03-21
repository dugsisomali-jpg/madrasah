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
  Clock
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
    <div className="p-8 space-y-6">
      <Skeleton className="h-12 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );

  if (children.length === 0) {
    return (
      <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-20 text-center shadow-sm">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
           <User className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Children Linked</h3>
        <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium text-sm">We couldn't find any students linked to your account. Please contact the administration if this is an error.</p>
      </div>
    );
  }

  const selectedChild = children.find((c) => c.id === selectedId) || children[0];
  const data = childData[selectedId || ''] || null;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  // Calculate quick stats
  const attendanceRate = data ? 
    (data.attendance.filter(r => r.status === 'PRESENT').length / Math.max(1, data.attendance.length) * 100).toFixed(0) : 0;
  
  const avgMarks = data && data.exams.length > 0 ? 
    (data.exams.reduce((sum, e) => sum + (e.marks / e.maxMarks), 0) / data.exams.length * 100).toFixed(0) : 0;

  const totalBalance = data ? 
    data.payments.reduce((sum, p) => sum + (n(p.totalDue) - n(p.discount) - n(p.amountPaid)), 0) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Premium Header & Student Selector */}
      <section className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-4">
        <div className="flex items-center gap-6">
           <div className="relative">
              <div className="h-20 w-20 rounded-[2rem] bg-indigo-600 p-1 shadow-2xl shadow-indigo-600/20">
                <div className="h-full w-full rounded-[1.8rem] bg-white overflow-hidden border-4 border-white">
                  {selectedChild.imagePath && urlEndpoint ? (
                    <Image
                      src={selectedChild.imagePath.startsWith('/') ? selectedChild.imagePath : `/${selectedChild.imagePath}`}
                      width={80}
                      height={80}
                      alt={selectedChild.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-slate-50 text-2xl font-black text-slate-300">
                      {selectedChild.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                 <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </div>
           </div>
           <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Student Profile</p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter sm:text-4xl">{selectedChild.name}</h1>
              {selectedChild.teacher && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold px-3">
                    <GraduationCap className="h-3 w-3 mr-1.5" />
                    {selectedChild.teacher.name || selectedChild.teacher.username}
                  </Badge>
                </div>
              )}
           </div>
        </div>

        {/* Horizontal Student List */}
        <div className="flex flex-wrap lg:flex-nowrap gap-2 p-2 bg-slate-100/50 rounded-[2rem] border border-slate-100">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedId(child.id)}
              className={`px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all ${
                selectedId === child.id 
                  ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 scale-105'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              {child.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-2xl shadow-indigo-600/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-110 transition-transform">
             <ClipboardCheck className="size-24" />
          </div>
          <CardHeader className="relative">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-100 opacity-80">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-5xl font-black tracking-tighter">{attendanceRate}%</div>
            <p className="text-xs font-bold text-indigo-100/80 mt-2 uppercase tracking-widest flex items-center gap-2">
              <Clock className="size-3" /> Monthly Average
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none bg-white shadow-sm border border-slate-100 overflow-hidden group">
           <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Score</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="text-5xl font-black tracking-tighter text-slate-900">{avgMarks}%</div>
              <p className="text-xs font-bold text-emerald-500 mt-2 uppercase tracking-widest flex items-center gap-2">
                 <Star className="size-3 fill-emerald-500" /> Overall Progress
              </p>
           </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none bg-white shadow-sm border border-slate-100 overflow-hidden group">
           <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Balance</CardTitle>
           </CardHeader>
           <CardContent>
              <div className={`text-5xl font-black tracking-tighter ${totalBalance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {totalBalance.toLocaleString()} <span className="text-xs font-black opacity-40">KES</span>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                 <TrendingDown className="size-3" /> Total Outstanding
              </p>
           </CardContent>
        </Card>
      </section>

      {/* Detailed Sections */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        {!data ? (
          <div className="p-20 text-center space-y-4">
             <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
          </div>
        ) : (
          <Tabs defaultValue="memorization" className="w-full">
            <div className="px-8 pt-8 border-b border-slate-50">
              <TabsList className="flex h-auto p-1 bg-slate-100 rounded-2xl gap-1">
                <TabsTrigger value="memorization" className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                  <BookOpen className="size-4 mr-2" /> Memorization
                </TabsTrigger>
                <TabsTrigger value="exams" className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                  <FileCheck className="size-4 mr-2" /> Exams
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                  <ClipboardCheck className="size-4 mr-2" /> Attendance
                </TabsTrigger>
                <TabsTrigger value="fees" className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                  <Banknote className="size-4 mr-2" /> Fees
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="memorization" className="p-2 focus-visible:outline-none">
              <div className="p-6">
                {data.memo.length === 0 ? (
                  <EmptyData icon={<BookOpen />} text="No memorization records found." />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                          <TableHead className="rounded-l-2xl py-4 px-6 text-[10px] font-black uppercase text-slate-400">Date</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-slate-400">Type</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-slate-400">Surah</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-slate-400">Pages/Ayahs</TableHead>
                          <TableHead className="rounded-r-2xl py-4 px-6 text-[10px] font-black uppercase text-slate-400 text-right">Rating</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.memo.map((r) => (
                          <TableRow key={r.id} className="hover:bg-slate-50/30 border-b border-slate-50">
                            <TableCell className="py-5 px-6 font-bold text-slate-500">{new Date(r.date).toLocaleDateString()}</TableCell>
                            <TableCell className="py-5 px-6">
                               <Badge variant="outline" className="bg-indigo-50 border-indigo-100 text-indigo-600 font-black text-[9px] uppercase tracking-widest px-3">
                                  {r.memorizationType}
                               </Badge>
                            </TableCell>
                            <TableCell className="py-5 px-6 font-black text-slate-900">{r.surahNumber}</TableCell>
                            <TableCell className="py-5 px-6 font-bold text-slate-600">{r.ayahStart} – {r.ayahEnd}</TableCell>
                            <TableCell className="py-5 px-6 text-right">
                               <div className="flex items-center justify-end gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`size-3 ${i < (r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
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

            <TabsContent value="exams" className="p-2 focus-visible:outline-none">
              <div className="p-6">
                {data.exams.length === 0 ? (
                  <EmptyData icon={<FileCheck />} text="No exam results available." />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50">
                          <TableHead className="rounded-l-2xl py-4 px-6 text-[10px] font-black uppercase text-slate-400">Date / Term</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-slate-400">Subject</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-slate-400">Assessment</TableHead>
                          <TableHead className="rounded-r-2xl py-4 px-6 text-[10px] font-black uppercase text-slate-400 text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.exams.map((e) => (
                          <TableRow key={e.id} className="hover:bg-slate-50/30 border-b border-slate-50">
                            <TableCell className="py-5 px-6">
                               <p className="font-black text-slate-900 leading-none mb-1">{e.term}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(e.date).toLocaleDateString()}</p>
                            </TableCell>
                            <TableCell className="py-5 px-6 font-bold text-slate-700">{e.Subject?.name || '—'}</TableCell>
                            <TableCell className="py-5 px-6">
                               <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold text-[9px] uppercase tracking-widest">
                                  {e.examType.replace(/_/g, ' ')}
                               </Badge>
                            </TableCell>
                            <TableCell className="py-5 px-6 text-right">
                               <span className="text-lg font-black text-slate-900">{e.marks}</span>
                               <span className="text-[10px] font-black text-slate-300 ml-1.5 uppercase tracking-widest">/ {e.maxMarks}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="p-2 focus-visible:outline-none">
               <div className="p-6">
                {data.attendance.length === 0 ? (
                  <EmptyData icon={<ClipboardCheck />} text="No attendance records recorded." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.attendance.map((r) => (
                      <div key={r.id} className="p-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/30 flex items-center justify-between">
                         <div>
                            <p className="font-bold text-slate-900">{new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(r.date).getFullYear()}</p>
                         </div>
                         <Badge 
                            variant="outline" 
                            className={`rounded-xl font-black text-[9px] uppercase tracking-widest px-3 py-1 ${
                               r.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                               r.status === 'ABSENT' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                               'bg-amber-50 text-amber-600 border-amber-100'
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

            <TabsContent value="fees" className="p-2 focus-visible:outline-none">
              <div className="p-6">
                {data.payments.length === 0 ? (
                  <EmptyData icon={<Banknote />} text="No fee records available." />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50">
                          <TableHead className="rounded-l-2xl py-4 px-6 text-[10px] font-black uppercase text-slate-400">Billing Period</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 text-right">Total Due</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 text-right">Amount Paid</TableHead>
                          <TableHead className="rounded-r-2xl py-4 px-6 text-[10px] font-black uppercase text-slate-400 text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.payments.map((p) => {
                          const balance = n(p.totalDue) - n(p.discount) - n(p.amountPaid);
                          return (
                            <TableRow key={p.id} className="hover:bg-slate-50/30 border-b border-slate-50">
                              <TableCell className="py-5 px-6">
                                 <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-[10px] uppercase">
                                       {MONTHS[p.month - 1].charAt(0)}
                                    </div>
                                    <div>
                                       <p className="font-black text-slate-900 leading-none">{MONTHS[p.month - 1]} {p.year}</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Tuition</p>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell className="py-5 px-6 text-right font-bold text-slate-400">{n(p.totalDue).toLocaleString()} <span className="text-[9px] font-black opacity-50 ml-1">KES</span></TableCell>
                              <TableCell className="py-5 px-6 text-right font-bold text-emerald-500">{n(p.amountPaid).toLocaleString()} <span className="text-[9px] font-black opacity-50 ml-1">KES</span></TableCell>
                              <TableCell className="py-5 px-6 text-right">
                                 <Badge className={`rounded-full font-black text-[10px] uppercase tracking-widest px-4 py-1.5 ${balance > 0 ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-50 shadow-none' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
                                    {balance > 0 ? `${balance.toLocaleString()} KES` : 'Cleared'}
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
          </Tabs>
        )}
      </section>
    </div>
  );
}

function EmptyData({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="py-20 text-center space-y-4 opacity-30 group">
       <div className="mx-auto size-14 rounded-[1.5rem] bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{text}</p>
    </div>
  );
}

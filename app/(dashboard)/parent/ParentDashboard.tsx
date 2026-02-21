'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { BookOpen, FileCheck, Banknote } from 'lucide-react';
import { Image, ImageKitProvider } from '@imagekit/next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@/components/ui/table';

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
  Student?: { name: string };
  Teacher?: { name: string };
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
  Student?: { name: string };
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
  const [childData, setChildData] = useState<Record<string, { memo: MemoRecord[]; exams: ExamResult[]; payments: Payment[] }>>({});
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
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

  // Keep selected in sync when children change
  useEffect(() => {
    if (children.length > 0 && (!selectedId || !children.some((c) => c.id === selectedId))) {
      setSelectedId(children[0].id);
    }
  }, [children, selectedId]);

  // Scroll active student into center when selection changes
  const scrollActiveToCenter = useCallback(() => {
    if (selectedId && cardRefs.current[selectedId]) {
      cardRefs.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedId]);

  useEffect(() => {
    scrollActiveToCenter();
  }, [scrollActiveToCenter]);

  const loadChildData = useCallback(async (childId: string) => {
    if (loadedIds.current.has(childId)) return;
    loadedIds.current.add(childId);
    const [memoRes, examsRes, paymentsRes] = await Promise.all([
      fetch(`/api/memorization?studentId=${childId}&limit=50`),
      fetch(`/api/exams?studentId=${childId}`),
      fetch(`/api/payments?studentId=${childId}&perPage=50`),
    ]);
    const memoData = await memoRes.json();
    const examsData = await examsRes.json();
    const paymentsData = await paymentsRes.json();
    setChildData((prev) => ({
      ...prev,
      [childId]: {
        memo: memoData?.data ?? memoData ?? [],
        exams: Array.isArray(examsData) ? examsData : [],
        payments: paymentsData?.payments ?? [],
      },
    }));
  }, []);

  useEffect(() => {
    if (selectedId) loadChildData(selectedId);
  }, [selectedId, loadChildData]);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (children.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center">
        <p className="text-muted-foreground">No children linked to your account.</p>
      </div>
    );
  }

  const selectedChild = children.find((c) => c.id === selectedId);
  const data = selectedId ? childData[selectedId] : null;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <h1 className="sr-only">My Children</h1>

      {/* Left: scrollable column of student cards */}
      <aside className="shrink-0 lg:w-56">
        <div className="flex max-h-[calc(100vh-8rem)] flex-col gap-2 overflow-y-auto rounded-xl border bg-card p-3 py-8 shadow-inner">
          <ImageKitProvider urlEndpoint={urlEndpoint || ''}>
            {children.map((child) => {
              const isActive = selectedId === child.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  ref={(el) => { cardRefs.current[child.id] = el; }}
                  onClick={() => setSelectedId(child.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    isActive
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className={`shrink-0 overflow-hidden rounded-full ${isActive ? 'h-14 w-14 ring-2 ring-primary' : 'h-10 w-10'}`}>
                    {child.imagePath && urlEndpoint ? (
                      <Image
                        src={child.imagePath.startsWith('/') ? child.imagePath : `/${child.imagePath}`}
                        width={isActive ? 112 : 80}
                        height={isActive ? 112 : 80}
                        transformation={[{ height: isActive ? '112' : '80', width: isActive ? '112' : '80', crop: 'at_max' }]}
                        responsive={false}
                        alt={child.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-lg font-bold text-muted-foreground">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className={`min-w-0 truncate font-medium ${isActive ? 'text-base' : 'text-sm text-muted-foreground'}`}>
                    {child.name}
                  </span>
                </button>
              );
            })}
          </ImageKitProvider>
        </div>
      </aside>

      {/* Right: memorization, exams, payments for selected student */}
      <main className="min-w-0 flex-1">
        {selectedChild ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{selectedChild.name}</h2>
              {selectedChild.teacher && (
                <p className="text-sm text-muted-foreground">
                  Teacher: {selectedChild.teacher.name || selectedChild.teacher.username}
                </p>
              )}
            </div>
            {!data ? (
              <TableSkeleton rows={6} cols={5} />
            ) : (
              <Tabs defaultValue="memorization" className="w-full">
                <TabsList className="grid h-12 w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                  <TabsTrigger value="memorization" className="flex min-h-[44px] items-center justify-center gap-1.5 text-xs sm:text-sm">
                    <BookOpen className="size-4 shrink-0" aria-hidden />
                    <span>Memo</span>
                  </TabsTrigger>
                  <TabsTrigger value="exams" className="flex min-h-[44px] items-center justify-center gap-1.5 text-xs sm:text-sm">
                    <FileCheck className="size-4 shrink-0" aria-hidden />
                    <span>Exams</span>
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="flex min-h-[44px] items-center justify-center gap-1.5 text-xs sm:text-sm">
                    <Banknote className="size-4 shrink-0" aria-hidden />
                    <span>Pay</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="memorization" className="mt-3 focus-visible:outline-none">
                  {data.memo.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No records yet.</p>
                  ) : (
                    <>
                      <TableContainer>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="whitespace-nowrap">Date</TableHead>
                              <TableHead className="whitespace-nowrap">Type</TableHead>
                              <TableHead className="whitespace-nowrap">Surah</TableHead>
                              <TableHead className="whitespace-nowrap">Ayah</TableHead>
                              <TableHead className="whitespace-nowrap">Rating</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.memo.slice(0, 20).map((r, i) => (
                              <TableRow key={r.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                                <TableCell className="whitespace-nowrap">{r.date?.slice?.(0, 10) ?? r.date}</TableCell>
                                <TableCell>{r.memorizationType}</TableCell>
                                <TableCell>{r.surahNumber}</TableCell>
                                <TableCell className="whitespace-nowrap">{r.ayahStart}–{r.ayahEnd}</TableCell>
                                <TableCell>{r.rating ?? '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {data.memo.length > 20 && (
                        <p className="mt-2 px-2 text-xs text-muted-foreground">
                          Showing 20 of {data.memo.length} records
                        </p>
                      )}
                    </>
                  )}
                </TabsContent>
                <TabsContent value="exams" className="mt-3 focus-visible:outline-none">
                  {data.exams.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No results yet.</p>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap">Subject</TableHead>
                            <TableHead className="whitespace-nowrap">Type</TableHead>
                            <TableHead className="whitespace-nowrap">Marks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.exams.map((e, i) => (
                            <TableRow key={e.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                              <TableCell className="whitespace-nowrap">{e.date?.slice?.(0, 10)}</TableCell>
                              <TableCell>{e.Subject?.name ?? '—'}</TableCell>
                              <TableCell>{e.examType?.replace(/_/g, ' ')}</TableCell>
                              <TableCell className="whitespace-nowrap">{e.marks} / {e.maxMarks}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </TabsContent>
                <TabsContent value="payments" className="mt-3 focus-visible:outline-none">
                  {data.payments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="whitespace-nowrap">Period</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Total due</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Paid</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.payments.map((p, i) => {
                            const balance = n(p.totalDue) - n(p.discount) - n(p.amountPaid);
                            return (
                              <TableRow key={p.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                                <TableCell>{MONTHS[p.month - 1]} {p.year}</TableCell>
                                <TableCell className="text-right">{n(p.totalDue).toLocaleString()} KES</TableCell>
                                <TableCell className="text-right">{n(p.amountPaid).toLocaleString()} KES</TableCell>
                                <TableCell className={`text-right font-medium ${balance > 0 ? 'text-destructive' : ''}`}>
                                  {balance.toLocaleString()} KES
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

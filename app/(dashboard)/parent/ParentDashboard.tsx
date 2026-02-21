'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { BookOpen, FileCheck, Banknote } from 'lucide-react';
import { Image, ImageKitProvider } from '@imagekit/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                        urlEndpoint={urlEndpoint}
                        src={child.imagePath.startsWith('/') ? child.imagePath : `/${child.imagePath}`}
                        transformation={[{ height: isActive ? '112' : '80', width: isActive ? '112' : '80', crop: 'at_max' }]}
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
              <p className="text-sm text-muted-foreground">Loading…</p>
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
                    <div className="overflow-x-auto rounded-lg border bg-background">
                      <table className="w-full min-w-[320px] text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-3 py-2.5 text-left font-medium">Date</th>
                            <th className="px-3 py-2.5 text-left font-medium">Type</th>
                            <th className="px-3 py-2.5 text-left font-medium">Surah</th>
                            <th className="px-3 py-2.5 text-left font-medium">Ayah</th>
                            <th className="px-3 py-2.5 text-left font-medium">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.memo.slice(0, 20).map((r) => (
                            <tr key={r.id} className="border-b">
                              <td className="px-3 py-2.5">{r.date?.slice?.(0, 10) ?? r.date}</td>
                              <td className="px-3 py-2.5">{r.memorizationType}</td>
                              <td className="px-3 py-2.5">{r.surahNumber}</td>
                              <td className="px-3 py-2.5">{r.ayahStart}–{r.ayahEnd}</td>
                              <td className="px-3 py-2.5">{r.rating ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {data.memo.length > 20 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          Showing 20 of {data.memo.length} records
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="exams" className="mt-3 focus-visible:outline-none">
                  {data.exams.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No results yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border bg-background">
                      <table className="w-full min-w-[280px] text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-3 py-2.5 text-left font-medium">Date</th>
                            <th className="px-3 py-2.5 text-left font-medium">Subject</th>
                            <th className="px-3 py-2.5 text-left font-medium">Type</th>
                            <th className="px-3 py-2.5 text-left font-medium">Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.exams.map((e) => (
                            <tr key={e.id} className="border-b">
                              <td className="px-3 py-2.5">{e.date?.slice?.(0, 10)}</td>
                              <td className="px-3 py-2.5">{e.Subject?.name ?? '—'}</td>
                              <td className="px-3 py-2.5">{e.examType?.replace(/_/g, ' ')}</td>
                              <td className="px-3 py-2.5">{e.marks} / {e.maxMarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="payments" className="mt-3 focus-visible:outline-none">
                  {data.payments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border bg-background">
                      <table className="w-full min-w-[280px] text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-3 py-2.5 text-left font-medium">Period</th>
                            <th className="px-3 py-2.5 text-right font-medium">Total due</th>
                            <th className="px-3 py-2.5 text-right font-medium">Paid</th>
                            <th className="px-3 py-2.5 text-right font-medium">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.payments.map((p) => {
                            const balance = n(p.totalDue) - n(p.discount) - n(p.amountPaid);
                            return (
                              <tr key={p.id} className="border-b">
                                <td className="px-3 py-2.5">{MONTHS[p.month - 1]} {p.year}</td>
                                <td className="px-3 py-2.5 text-right">{n(p.totalDue).toLocaleString()} KES</td>
                                <td className="px-3 py-2.5 text-right">{n(p.amountPaid).toLocaleString()} KES</td>
                                <td className={`px-3 py-2.5 text-right ${balance > 0 ? 'text-destructive font-medium' : ''}`}>
                                  {balance.toLocaleString()} KES
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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

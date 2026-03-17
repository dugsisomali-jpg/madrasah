'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, AlertCircle, Save, Loader2, Calendar as CalendarIcon } from 'lucide-react';

type Student = {
  id: string;
  name: string;
  teacherId?: string;
  teacher?: { name?: string; username: string };
};

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatus;
  notes?: string | null;
};

export function AttendanceContent({ initialStudents }: { initialStudents: Student[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  async function fetchAttendance() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${selectedDate}`);
      if (!res.ok) {
        setRecords({});
        return;
      }
      const data = await res.json();
      
      const recordMap: Record<string, AttendanceRecord> = {};
      if (Array.isArray(data)) {
        data.forEach((r: any) => {
          recordMap[r.studentId] = {
            studentId: r.studentId,
            status: r.status,
            notes: r.notes,
          };
        });
      }
      setRecords(recordMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function updateStatus(studentId: string, status: AttendanceStatus) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], studentId, status },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          records: Object.values(records),
        }),
      });
      if (res.ok) {
        // Show success toast? (assuming standard implementation)
        alert('Attendance saved successfully');
      }
    } catch (err) {
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-5 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Attendance
        </button>
      </div>

      {/* Student List */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {initialStudents.map((student) => {
              const record = records[student.id];
              const status = record?.status;

              return (
                <tr key={student.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.teacher?.name || student.teacher?.username || 'No teacher'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <StatusButton
                        active={status === 'PRESENT'}
                        onClick={() => updateStatus(student.id, 'PRESENT')}
                        color="bg-green-500"
                        icon={<Check className="size-3.5" />}
                        label="P"
                      />
                      <StatusButton
                        active={status === 'ABSENT'}
                        onClick={() => updateStatus(student.id, 'ABSENT')}
                        color="bg-red-500"
                        icon={<X className="size-3.5" />}
                        label="A"
                      />
                      <StatusButton
                        active={status === 'LATE'}
                        onClick={() => updateStatus(student.id, 'LATE')}
                        color="bg-yellow-500"
                        icon={<Clock className="size-3.5" />}
                        label="L"
                      />
                      <StatusButton
                        active={status === 'EXCUSED'}
                        onClick={() => updateStatus(student.id, 'EXCUSED')}
                        color="bg-blue-500"
                        icon={<AlertCircle className="size-3.5" />}
                        label="E"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Add note..."
                      value={record?.notes || ''}
                      onChange={(e) =>
                        setRecords((prev) => ({
                          ...prev,
                          [student.id]: {
                            ...prev[student.id],
                            studentId: student.id,
                            status: status || 'PRESENT',
                            notes: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-lg border bg-transparent px-3 py-1 text-sm outline-none focus:border-primary"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusButton({
  active,
  onClick,
  color,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
        active
          ? `${color} border-transparent text-white shadow-sm`
          : 'border-input bg-background text-muted-foreground hover:bg-muted'
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}

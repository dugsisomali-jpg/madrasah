'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type TeacherUser = { id: string; username: string; name?: string | null };

export function TeachersList() {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);

  useEffect(() => {
    fetch('/api/users/teachers')
      .then((r) => r.json())
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch(() => setTeachers([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Teachers are users with the teacher role. Assign the teacher role in User Management to add teachers.
        </p>
        <ul className="divide-y">
          {teachers.map((t) => (
            <li key={t.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
              <span>{t.name || t.username}</span>
              <span className="text-sm text-muted-foreground">@{t.username}</span>
            </li>
          ))}
          {teachers.length === 0 && (
            <p className="text-muted-foreground py-4">
              No teachers yet. Go to <Link href="/users" className="text-primary underline">User Management</Link> and assign the teacher role to users.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}

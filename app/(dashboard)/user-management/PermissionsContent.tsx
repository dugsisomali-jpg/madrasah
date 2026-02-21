'use client';

import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
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

type Permission = { id: string; name: string; resource: string; action: string; description?: string };

const RESOURCES = ['users', 'roles', 'permissions', 'memorization', 'students', 'teachers', 'exams'];
const ACTIONS = ['manage', 'read', 'create', 'update', 'delete'];

const inputCls =
  'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';
const selectCls =
  'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

export function PermissionsContent() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [name, setName] = useState('');
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const load = () => {
    setPermissionsLoading(true);
    fetch('/api/permissions')
      .then((r) => r.json())
      .then((data) => setPermissions(Array.isArray(data) ? data : []))
      .catch(() => setPermissions([]))
      .finally(() => setPermissionsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !resource || !action) return;
    setLoading(true);
    fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        resource,
        action,
        description: description.trim() || undefined,
      }),
    })
      .then(() => {
        setName('');
        setResource('');
        setAction('');
        setDescription('');
        load();
      })
      .finally(() => setLoading(false));
  };

  const btnPrimary =
    'inline-flex h-11 items-center justify-center rounded-xl bg-slate-700 px-5 text-sm font-medium text-white shadow-md hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-700';

  return (
    <div className="space-y-8">
      {/* Add permission */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-sm dark:border-slate-700/50">
        <div className="border-b border-slate-200/60 bg-slate-50/80 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/30">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Add permission</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Define fine-grained permissions (resource.action) for roles or users.
          </p>
        </div>
        <form onSubmit={handleCreate} className="grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <label htmlFor="permName" className="mb-1.5 block text-sm font-medium">
              Name
            </label>
            <input
              id="permName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. users.manage"
              required
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="resource" className="mb-1.5 block text-sm font-medium">
              Resource
            </label>
            <select
              id="resource"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              required
              className={selectCls}
            >
              <option value="">Select resource</option>
              {RESOURCES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="action" className="mb-1.5 block text-sm font-medium">
              Action
            </label>
            <select
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              required
              className={selectCls}
            >
              <option value="">Select action</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="permDesc" className="mb-1.5 block text-sm font-medium">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="permDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this permission allows"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={loading} className={btnPrimary}>
              Add permission
            </button>
          </div>
        </form>
      </div>

      {/* Permissions table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-sm dark:border-slate-700/50">
        <div className="flex items-center gap-3 border-b border-slate-200/60 bg-slate-50/80 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/30">
          <KeyRound className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Permissions</h3>
        </div>
        <div className="p-4">
        {permissionsLoading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : permissions.length > 0 ? (
          <TableContainer className="border border-slate-200/60 rounded-xl dark:border-slate-700/50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Resource</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                  <TableHead className="text-muted-foreground">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((p, i) => (
                  <TableRow key={p.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.resource}</TableCell>
                    <TableCell>{p.action}</TableCell>
                    <TableCell className="text-muted-foreground">{p.description ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/20">
            <p className="text-sm text-muted-foreground">
              No permissions yet. Run <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">npm run db:seed:roles</code>
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

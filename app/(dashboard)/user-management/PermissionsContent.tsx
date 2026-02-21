'use client';

import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';

type Permission = { id: string; name: string; resource: string; action: string; description?: string };

const RESOURCES = ['users', 'roles', 'permissions', 'memorization', 'students', 'teachers', 'exams'];
const ACTIONS = ['manage', 'read', 'create', 'update', 'delete'];

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const selectCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function PermissionsContent() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [name, setName] = useState('');
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetch('/api/permissions').then((r) => r.json()).then(setPermissions).catch(() => setPermissions([]));
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
    'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

  return (
    <div className="space-y-8">
      {/* Add permission */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Add permission</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Define fine-grained permissions (resource.action) that can be assigned to roles or users directly.
        </p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2">
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
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-4">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Permissions</h3>
        </div>
        {permissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="h-11 px-6 text-left font-medium">Name</th>
                  <th className="h-11 px-6 text-left font-medium">Resource</th>
                  <th className="h-11 px-6 text-left font-medium">Action</th>
                  <th className="h-11 px-6 text-left font-medium text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.id} className="border-b transition-colors hover:bg-muted/20">
                    <td className="px-6 py-4 font-medium">{p.name}</td>
                    <td className="px-6 py-4">{p.resource}</td>
                    <td className="px-6 py-4">{p.action}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.description ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No permissions yet. Run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run db:seed:roles</code>
          </div>
        )}
      </div>
    </div>
  );
}

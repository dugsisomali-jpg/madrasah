'use client';

import { useEffect, useState } from 'react';
import { Shield, KeyRound } from 'lucide-react';

type Role = { id: string; name: string; description?: string; permissions: { id: string; name: string }[] };
type Permission = { id: string; name: string; resource: string; action: string };

const inputCls =
  'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
const btnPrimary = `${btnBase} bg-slate-700 text-white shadow-md hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700`;
const btnSecondary = `${btnBase} border border-input bg-background hover:bg-accent hover:text-accent-foreground`;

export function RolesContent() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPermIds, setEditPermIds] = useState<Set<string>>(new Set());

  const load = () => {
    setRolesLoading(true);
    Promise.all([
      fetch('/api/roles').then((r) => r.json()).then((data) => (Array.isArray(data) ? data : [])).catch(() => []),
      fetch('/api/permissions').then((r) => r.json()).then((data) => (Array.isArray(data) ? data : [])).catch(() => []),
    ]).then(([rolesData, permsData]) => {
      setRoles(rolesData);
      setPermissions(permsData);
    }).finally(() => setRolesLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    })
      .then(() => {
        setName('');
        setDescription('');
        load();
      })
      .finally(() => setLoading(false));
  };

  const handleAssignPermissions = (roleId: string) => {
    if (editing === roleId) {
      setLoading(true);
      fetch(`/api/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds: Array.from(editPermIds) }),
      })
        .then(() => {
          setEditing(null);
          load();
        })
        .finally(() => setLoading(false));
    } else {
      const r = roles.find((x) => x.id === roleId);
      setEditPermIds(new Set(r?.permissions.map((p) => p.id) ?? []));
      setEditing(roleId);
    }
  };

  const togglePerm = (permId: string) => {
    setEditPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Add role */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-sm dark:border-slate-700/50">
        <div className="border-b border-slate-200/60 bg-slate-50/80 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/30">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Add role</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Roles bundle permissions together for easier assignment.
          </p>
        </div>
        <form onSubmit={handleCreate} className="flex flex-col gap-4 p-6 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2 sm:min-w-[160px]">
            <label htmlFor="roleName" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="roleName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. teacher"
              required
              className={inputCls}
            />
          </div>
          <div className="space-y-2 sm:min-w-[200px]">
            <label htmlFor="roleDesc" className="block text-sm font-medium">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="roleDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Role description"
              className={inputCls}
            />
          </div>
          <button type="submit" disabled={loading} className={`h-11 rounded-xl px-5 ${btnPrimary}`}>
            Add role
          </button>
        </form>
      </div>

      {/* Roles list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-sm dark:border-slate-700/50">
        <div className="flex items-center gap-3 border-b border-slate-200/60 bg-slate-50/80 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/30">
          <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Roles</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {roles.map((r) => (
            <div key={r.id} className="px-6 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>
                  {r.description && (
                    <span className="ml-2 text-sm text-muted-foreground">— {r.description}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleAssignPermissions(r.id)}
                  disabled={loading}
                  className={`rounded-xl text-xs h-9 px-3 ${btnSecondary}`}
                >
                  {editing === r.id ? 'Save' : 'Edit permissions'}
                </button>
              </div>
              {editing === r.id ? (
                <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
                  {permissions.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-background px-2.5 py-1.5 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50 has-[:checked]:bg-slate-200 has-[:checked]:text-slate-900 dark:has-[:checked]:bg-slate-600 dark:has-[:checked]:text-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={editPermIds.has(p.id)}
                        onChange={() => togglePerm(p.id)}
                        className="h-3.5 w-3.5 rounded border-input"
                      />
                      <KeyRound className="h-3 w-3 text-muted-foreground" />
                      <span>{p.name}</span>
                    </label>
                  ))}
                  {permissions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No permissions available.</p>
                  )}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.permissions.length > 0 ? (
                    r.permissions.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-600/60 dark:text-slate-200"
                      >
                        <KeyRound className="h-3 w-3" />
                        {p.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No permissions</span>
                  )}
                </div>
              )}
            </div>
          ))}
          {!rolesLoading && roles.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No roles yet. Run <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">npm run db:seed:roles</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

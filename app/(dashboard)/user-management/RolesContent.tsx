'use client';

import { useEffect, useState } from 'react';
import { Shield, KeyRound } from 'lucide-react';

type Role = { id: string; name: string; description?: string; permissions: { id: string; name: string }[] };
type Permission = { id: string; name: string; resource: string; action: string };

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
const btnPrimary = `${btnBase} bg-primary text-primary-foreground shadow-sm hover:bg-primary/90`;
const btnSecondary = `${btnBase} border border-input bg-background hover:bg-accent hover:text-accent-foreground`;

export function RolesContent() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPermIds, setEditPermIds] = useState<Set<string>>(new Set());

  const load = () => {
    fetch('/api/roles').then((r) => r.json()).then(setRoles).catch(() => setRoles([]));
    fetch('/api/permissions').then((r) => r.json()).then(setPermissions).catch(() => setPermissions([]));
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
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Add role</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Roles bundle permissions together for easier assignment.
        </p>
        <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
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
          <button type="submit" disabled={loading} className={btnPrimary}>
            Add role
          </button>
        </form>
      </div>

      {/* Roles list */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Roles</h3>
        </div>
        <div className="divide-y">
          {roles.map((r) => (
            <div key={r.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-medium">{r.name}</span>
                  {r.description && (
                    <span className="ml-2 text-sm text-muted-foreground">— {r.description}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleAssignPermissions(r.id)}
                  disabled={loading}
                  className={btnSecondary + ' text-xs h-8 px-3'}
                >
                  {editing === r.id ? 'Save' : 'Edit permissions'}
                </button>
              </div>
              {editing === r.id ? (
                <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-input bg-muted/30 p-3">
                  {permissions.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md bg-background px-2.5 py-1.5 text-sm transition-colors hover:bg-accent/50 has-[:checked]:bg-primary/10"
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
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
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
          {roles.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No roles yet. Run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run db:seed:roles</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

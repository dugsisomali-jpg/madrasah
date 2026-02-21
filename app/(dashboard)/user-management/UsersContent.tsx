'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Shield, KeyRound, Users } from 'lucide-react';

type User = {
  id: string;
  username: string;
  name?: string;
  roles: { id: string; name: string }[];
  directPermissions?: { id: string; name: string }[];
};
type Role = { id: string; name: string };
type Permission = { id: string; name: string };

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
const btnPrimary = `${btnBase} bg-primary text-primary-foreground shadow-sm hover:bg-primary/90`;
const btnSecondary = `${btnBase} border border-input bg-background hover:bg-accent hover:text-accent-foreground`;

export function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRoleIds, setEditRoleIds] = useState<Set<string>>(new Set());
  const [editPermIds, setEditPermIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);

  const load = () => {
    setError(null);
    setUsersLoading(true);
    fetch('/api/users')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error ?? 'Failed to load users');
        return Array.isArray(data) ? data : [];
      })
      .then(setUsers)
      .catch((e) => {
        setError(e.message);
        setUsers([]);
      })
      .finally(() => setUsersLoading(false));
    fetch('/api/roles')
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setRoles(d) : setRoles([])))
      .catch(() => setRoles([]));
    fetch('/api/permissions')
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setPermissions(d) : setPermissions([])))
      .catch(() => setPermissions([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim(),
        password,
        name: name.trim() || undefined,
      }),
    })
      .then(() => {
        setUsername('');
        setPassword('');
        setName('');
        setAddOpen(false);
        load();
      })
      .finally(() => setLoading(false));
  };

  const openEditModal = (user: User) => {
    setEditUser(user);
    setEditRoleIds(new Set(user.roles.map((r) => r.id)));
    setEditPermIds(new Set((user.directPermissions ?? []).map((p) => p.id)));
  };

  const handleSaveAccess = () => {
    if (!editUser) return;
    setLoading(true);
    fetch(`/api/users/${editUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roleIds: Array.from(editRoleIds),
        permissionIds: Array.from(editPermIds),
      }),
    })
      .then(() => {
        setEditUser(null);
        load();
      })
      .finally(() => setLoading(false));
  };

  const toggleRole = (id: string) => {
    setEditRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePerm = (id: string) => {
    setEditPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            Manage accounts. Grant access via <strong>roles</strong> (bundled permissions) or assign <strong>direct permissions</strong> for fine-grained control.
          </p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className={btnPrimary}>
          <UserPlus className="h-4 w-4" />
          Add user
        </button>
      </div>

      {/* Add user modal */}
      {addOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setAddOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Add new user</h2>
            <p className="mt-1 text-sm text-muted-foreground">Username and password are required.</p>
            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                  Display name <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className={inputCls}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAddOpen(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Edit access modal (roles + direct permissions) */}
      {editUser && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditUser(null)}
            aria-hidden="true"
          />
          <div className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card shadow-xl">
            <div className="sticky top-0 border-b bg-card/95 px-6 py-4 backdrop-blur">
              <h2 className="text-lg font-semibold">Access control</h2>
              <p className="text-sm text-muted-foreground">
                {editUser.name ?? editUser.username} — roles and direct permissions
              </p>
            </div>
            <div className="space-y-6 p-6">
              {/* Roles section */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Roles</h3>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Roles grant a set of permissions together.
                </p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <label
                      key={r.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 transition-colors hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                    >
                      <input
                        type="checkbox"
                        checked={editRoleIds.has(r.id)}
                        onChange={() => toggleRole(r.id)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="text-sm font-medium">{r.name}</span>
                    </label>
                  ))}
                  {roles.length === 0 && (
                    <p className="text-sm text-muted-foreground">No roles available.</p>
                  )}
                </div>
              </section>

              {/* Direct permissions section */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Direct permissions</h3>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Assign specific permissions directly to this user, in addition to those from roles.
                </p>
                <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-input bg-muted/30 p-3">
                  {permissions.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md bg-background px-2.5 py-1.5 text-sm transition-colors hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:text-primary-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={editPermIds.has(p.id)}
                        onChange={() => togglePerm(p.id)}
                        className="h-3.5 w-3.5 rounded border-input"
                      />
                      <span>{p.name}</span>
                    </label>
                  ))}
                  {permissions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No permissions available.</p>
                  )}
                </div>
              </section>
            </div>
            <div className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
              <button type="button" onClick={() => setEditUser(null)} className={btnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAccess}
                disabled={loading}
                className={btnPrimary}
              >
                {loading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Users list */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Users</h3>
        </div>
        <div>
          {usersLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="py-12 text-center text-destructive">{error}</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">No users yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first user to get started.</p>
              <button type="button" onClick={() => setAddOpen(true)} className={`mt-6 ${btnPrimary}`}>
                <UserPlus className="h-4 w-4" />
                Add user
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.username}</span>
                      {u.name && (
                        <span className="text-muted-foreground text-sm">— {u.name}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {u.roles.length > 0 &&
                        u.roles.map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            <Shield className="h-3 w-3" />
                            {r.name}
                          </span>
                        ))}
                      {(u.directPermissions ?? []).length > 0 &&
                        (u.directPermissions ?? []).map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
                          >
                            <KeyRound className="h-3 w-3" />
                            {p.name}
                          </span>
                        ))}
                      {u.roles.length === 0 && (u.directPermissions ?? []).length === 0 && (
                        <span className="text-muted-foreground text-xs">No access assigned</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditModal(u)}
                    className={`self-start sm:self-center ${btnSecondary}`}
                  >
                    <Shield className="h-4 w-4" />
                    Edit access
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Shield, KeyRound, Users, Pencil } from 'lucide-react';

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
  'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
const btnPrimary = `${btnBase} bg-slate-700 text-white shadow-md hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700`;
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
  const [editProfileUser, setEditProfileUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
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

  const openEditProfileModal = (user: User) => {
    setError(null);
    setEditProfileUser(user);
    setEditUsername(user.username);
    setEditName(user.name ?? '');
    setEditPassword('');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileUser) return;
    if (!editUsername.trim()) return;
    setLoading(true);
    const body: { username: string; name?: string; password?: string } = {
      username: editUsername.trim(),
      name: editName.trim() || undefined,
    };
    if (editPassword.trim().length >= 6) body.password = editPassword.trim();
    fetch(`/api/users/${editProfileUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error ?? 'Failed to update user');
        setEditProfileUser(null);
        setEditUsername('');
        setEditName('');
        setEditPassword('');
        load();
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
          <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Grant access via <strong>roles</strong> or <strong>direct permissions</strong>.
          </p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className={`h-11 rounded-xl px-5 ${btnPrimary}`}>
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
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-2xl dark:border-slate-700/50">
            <div className="border-b border-border bg-gradient-to-r from-slate-100 to-transparent px-6 py-4 dark:from-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add new user</h2>
              <p className="mt-1 text-sm text-muted-foreground">Username and password are required.</p>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
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
                <button type="submit" disabled={loading} className={`h-11 rounded-xl px-5 ${btnPrimary}`}>
                  {loading ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Edit user (profile) modal */}
      {editProfileUser && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => { setEditProfileUser(null); setError(null); }}
            aria-hidden="true"
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-2xl dark:border-slate-700/50">
            <div className="border-b border-border bg-gradient-to-r from-slate-100 to-transparent px-6 py-4 dark:from-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit user</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Change username, display name, or set a new password.
              </p>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4 p-6">
              <div>
                <label htmlFor="edit-username" className="mb-1.5 block text-sm font-medium">
                  Username
                </label>
                <input
                  id="edit-username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g. admin"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium">
                  Display name <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="edit-password" className="mb-1.5 block text-sm font-medium">
                  New password <span className="text-muted-foreground">(leave blank to keep current)</span>
                </label>
                <input
                  id="edit-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={inputCls}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setEditProfileUser(null); setError(null); }} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className={`h-11 rounded-xl px-5 ${btnPrimary}`}>
                  {loading ? 'Saving…' : 'Save changes'}
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
          <div className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200/60 bg-card shadow-2xl dark:border-slate-700/50">
            <div className="sticky top-0 border-b border-border bg-gradient-to-r from-slate-100 to-transparent px-6 py-4 backdrop-blur dark:from-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Access control</h2>
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
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-background px-3 py-2 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800/50 has-[:checked]:border-slate-600 has-[:checked]:bg-slate-100 dark:has-[:checked]:border-slate-500 dark:has-[:checked]:bg-slate-700/50"
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
                <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
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
                      <span>{p.name}</span>
                    </label>
                  ))}
                  {permissions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No permissions available.</p>
                  )}
                </div>
              </section>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200/60 bg-slate-50/80 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/30">
              <button type="button" onClick={() => setEditUser(null)} className={btnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAccess}
                disabled={loading}
                className={`h-11 rounded-xl px-5 ${btnPrimary}`}
              >
                {loading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Users list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-sm dark:border-slate-700/50">
        <div className="flex items-center gap-3 border-b border-slate-200/60 bg-slate-50/80 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/30">
          <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Users</h3>
        </div>
        <div>
          {usersLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
                      <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
                      <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
                      <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
                    </div>
                  </div>
                  <div className="h-9 w-24 animate-pulse rounded-lg bg-muted self-start sm:self-center" />
                </div>
              ))}
            </div>
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
                  className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 transition-colors last:border-b-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
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
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-600/60 dark:text-slate-200"
                          >
                            <Shield className="h-3 w-3" />
                            {r.name}
                          </span>
                        ))}
                      {(u.directPermissions ?? []).length > 0 &&
                        (u.directPermissions ?? []).map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-200/80 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-600/40 dark:text-violet-200"
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
                  <div className="flex flex-wrap gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => openEditProfileModal(u)}
                      title="Edit user"
                      className={`rounded-xl p-2 ${btnSecondary}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      title="Edit access"
                      className={`rounded-xl p-2 ${btnSecondary}`}
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

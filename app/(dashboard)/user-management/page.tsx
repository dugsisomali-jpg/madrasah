'use client';

import { useState } from 'react';
import { UsersContent } from './UsersContent';
import { RolesContent } from './RolesContent';
import { PermissionsContent } from './PermissionsContent';
import { Users, Shield, KeyRound } from 'lucide-react';

export default function UserManagementPage() {
  const [tab, setTab] = useState('users');
  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'permissions', label: 'Permissions', icon: KeyRound },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Hero: User Management */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 via-violet-50/60 to-slate-50 dark:border-slate-700/50 dark:from-slate-900/50 dark:via-violet-950/20 dark:to-slate-900/50">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-700 text-white shadow-lg shadow-slate-700/25 dark:bg-slate-600">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                User Management
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Users, roles, and permissions. Grant access via roles or direct permissions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200/60 bg-slate-100/50 p-1.5 dark:border-slate-700/50 dark:bg-slate-800/30">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersContent />}
      {tab === 'roles' && <RolesContent />}
      {tab === 'permissions' && <PermissionsContent />}
    </div>
  );
}

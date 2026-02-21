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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">User Management</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Users, roles, and permissions. Grant access via roles or direct permissions.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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

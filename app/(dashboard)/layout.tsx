import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { isParentRole, getUserPermissions } from '@/lib/auth-utils';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { ParentLayout } from '@/components/parent-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const userId = session.user.id;
  const isParent = userId ? await isParentRole(userId) : false;

  if (isParent) {
    return (
      <ParentLayout user={session.user}>
        {children}
      </ParentLayout>
    );
  }

  const permissions = userId ? await getUserPermissions(userId) : [];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <AppSidebar user={session.user} permissions={permissions} />
      <main className="lg:pl-72 transition-all duration-300">
        <AppHeader user={session.user} />
        <div className="min-h-[calc(100vh-5rem)] p-4 lg:p-10">
          <div className="bg-white/40 backdrop-blur-sm rounded-[3rem] border border-white/20 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

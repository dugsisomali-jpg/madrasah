import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { isParentRole } from '@/lib/auth-utils';
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

  const isParent = session?.user?.id ? await isParentRole(session.user.id) : false;

  if (isParent) {
    return (
      <ParentLayout user={session.user}>
        {children}
      </ParentLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar user={session.user} />
      <main className="lg:pl-64">
        <AppHeader user={session.user} />
        <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-3.5rem)] px-2 sm:px-4 lg:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}

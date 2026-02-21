import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isParentRole } from '@/lib/auth-utils';
import { ParentDashboard } from './ParentDashboard';

export default async function ParentPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const isParent = session?.user?.id ? await isParentRole(session.user.id) : false;
  if (!isParent) redirect('/');

  return <ParentDashboard />;
}

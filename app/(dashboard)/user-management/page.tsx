import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/auth-utils';
import UserManagementContent from '@/app/(dashboard)/user-management/UserManagementContent';

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const canRead = await hasPermission(session.user.id, 'users.read');
  if (!canRead) {
    // Redirect to dashboard or home if they don't have access
    redirect('/');
  }

  return <UserManagementContent />;
}

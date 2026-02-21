import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: ['/', '/memorization/:path*', '/students/:path*', '/teachers/:path*', '/exams/:path*', '/user-management/:path*'],
};

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUploadAuthParams } from '@imagekit/next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  if (!privateKey || !publicKey) {
    return NextResponse.json(
      { error: 'ImageKit is not configured. Add IMAGEKIT_PRIVATE_KEY and IMAGEKIT_PUBLIC_KEY.' },
      { status: 500 }
    );
  }

  try {
    const auth = getUploadAuthParams({ privateKey, publicKey });
    return NextResponse.json(auth);
  } catch (err) {
    console.error('ImageKit auth error:', err);
    return NextResponse.json({ error: 'Failed to generate upload auth' }, { status: 500 });
  }
}

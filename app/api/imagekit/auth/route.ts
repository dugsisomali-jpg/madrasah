import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getImageKitAuth } from '@/lib/imagekit';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    return NextResponse.json(
      { error: 'ImageKit is not configured. Add IMAGEKIT_* env vars.' },
      { status: 500 }
    );
  }

  try {
    const auth = getImageKitAuth();
    return NextResponse.json(auth);
  } catch (err) {
    console.error('ImageKit auth error:', err);
    return NextResponse.json({ error: 'Failed to generate upload auth' }, { status: 500 });
  }
}

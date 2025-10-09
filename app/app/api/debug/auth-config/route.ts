
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const config = {
    secret: authOptions.secret ? '✅ Set (hidden)' : '❌ Not set',
    providers: authOptions.providers.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type
    })),
    session: authOptions.session,
    pages: authOptions.pages,
    debug: authOptions.debug,
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '❌ Not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Not set',
      NODE_ENV: process.env.NODE_ENV
    }
  };

  return NextResponse.json(config);
}


import { NextResponse } from 'next/server';
import { initializeStartupServices } from '@/lib/startup-init';

export async function GET() {
  try {
    initializeStartupServices();
    return NextResponse.json({ success: true, message: 'Services initialized' });
  } catch (error: any) {
    console.error('Error initializing services:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

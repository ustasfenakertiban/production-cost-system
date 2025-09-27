
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "Authentication not required for this application"
  });
}

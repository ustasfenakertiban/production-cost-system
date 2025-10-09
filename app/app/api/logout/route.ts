
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Удаляем cookie с токеном
  response.cookies.delete('auth-token');
  
  return response;
}

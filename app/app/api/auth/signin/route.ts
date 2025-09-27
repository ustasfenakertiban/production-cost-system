

import { NextResponse } from 'next/server';

export async function POST() {
  // Заглушка - аутентификация не требуется
  return NextResponse.json({
    message: "Authentication not required for this application"
  });
}

export async function GET() {
  // Заглушка - аутентификация не требуется  
  return NextResponse.json({
    message: "Authentication not required for this application"
  });
}

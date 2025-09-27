

import { NextResponse } from 'next/server';

export async function GET() {
  // Заглушка для совместимости с тестовым инструментом
  return NextResponse.json({
    csrfToken: "no-auth-required"
  });
}

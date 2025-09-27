

import { NextResponse } from 'next/server';

export async function POST() {
  // Заглушка - регистрация не требуется
  return NextResponse.json({
    message: "Registration not required for this application"
  });
}

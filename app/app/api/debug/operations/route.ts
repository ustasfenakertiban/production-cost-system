import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Debug endpoint removed" }, { status: 410 });
}

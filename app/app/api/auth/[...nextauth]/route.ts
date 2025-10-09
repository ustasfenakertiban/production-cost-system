
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

export async function GET(req: NextRequest, context: any) {
  console.log('[NextAuth Route] GET request:', req.nextUrl.pathname, req.nextUrl.searchParams.toString());
  return handler(req, context);
}

export async function POST(req: NextRequest, context: any) {
  console.log('[NextAuth Route] POST request:', req.nextUrl.pathname);
  const body = await req.clone().text();
  console.log('[NextAuth Route] Request body:', body.substring(0, 200));
  return handler(req, context);
}

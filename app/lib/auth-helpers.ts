
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function verifyAuth(request: NextRequest): Promise<{ authenticated: boolean; user?: any; error?: string }> {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return { authenticated: false, error: 'No auth token' };
    }
    
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development'
    );
    
    const { payload } = await jwtVerify(authToken, secret);
    
    return { 
      authenticated: true, 
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name
      }
    };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' };
  }
}

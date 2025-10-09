
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development',
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        console.log('[Auth] === AUTHORIZE FUNCTION CALLED ===');
        console.log('[Auth] Credentials:', { email: credentials?.email, hasPassword: !!credentials?.password });
        console.log('[Auth] Request headers:', req?.headers);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials');
          return null;
        }

        console.log('[Auth] Attempting login for:', credentials.email);

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          console.log('[Auth] User not found or no password set');
          return null;
        }

        console.log('[Auth] User found, checking password');

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        console.log('[Auth] Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          return null;
        }

        console.log('[Auth] Login successful for:', user.email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Обновлять сессию каждые 24 часа
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // При первом входе сохраняем данные пользователя
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      // При обновлении сессии сохраняем существующие данные
      return token;
    },
    async session({ session, token }) {
      // Всегда передаём данные из токена в сессию
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  debug: true, // Debug enabled for troubleshooting
  logger: {
    error(code, ...message) {
      console.error('[NextAuth Error]', code, message);
    },
    warn(code, ...message) {
      console.warn('[NextAuth Warn]', code, message);
    },
    debug(code, ...message) {
      console.log('[NextAuth Debug]', code, message);
    },
  },
};

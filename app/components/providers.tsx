
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { StartupInitializer } from "./startup-initializer";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <StartupInitializer />
      {children}
    </SessionProvider>
  );
}

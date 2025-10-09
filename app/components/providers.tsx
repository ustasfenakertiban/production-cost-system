
"use client";

import { ReactNode } from "react";
import { StartupInitializer } from "./startup-initializer";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <StartupInitializer />
      {children}
    </>
  );
}

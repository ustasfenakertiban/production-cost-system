
"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthHeader() {
  const { data: session, status } = useSession() || {};
  const [mounted, setMounted] = useState(false);

  // Рендерим только на клиенте для избежания ошибки гидратации
  useEffect(() => {
    setMounted(true);
  }, []);

  // Показываем пустой div до монтирования, чтобы избежать hydration mismatch
  if (!mounted || status === "loading") {
    return <div className="bg-white/70 backdrop-blur-sm border-b h-[60px]" />;
  }

  if (!session?.user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-6xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
            {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {session.user.name || "Пользователь"}
            </div>
            <div className="text-xs text-gray-500">{session.user.email}</div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-2" />
              Профиль
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

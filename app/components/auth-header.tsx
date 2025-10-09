
"use client";

import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserData {
  id: string;
  email: string;
  name: string;
}

export function AuthHeader() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  // Рендерим только на клиенте для избежания ошибки гидратации
  useEffect(() => {
    setMounted(true);
    // Получаем данные пользователя из API
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  // Показываем пустой div до монтирования, чтобы избежать hydration mismatch
  if (!mounted) {
    return <div className="bg-white/70 backdrop-blur-sm border-b h-[60px]" />;
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/auth/signin');
    router.refresh();
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-6xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {user.name || "Пользователь"}
            </div>
            <div className="text-xs text-gray-500">{user.email}</div>
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

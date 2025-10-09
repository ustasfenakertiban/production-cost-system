
"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  
  const errorMessages: Record<string, string> = {
    Configuration: "Ошибка конфигурации сервера",
    AccessDenied: "Доступ запрещен",
    Verification: "Ошибка проверки",
    Default: "Произошла ошибка при авторизации",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <CardTitle>Ошибка авторизации</CardTitle>
        <CardDescription>{errorMessage}</CardDescription>
        {error && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
            Код ошибки: {error}
          </div>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <Button asChild className="w-full">
          <Link href="/auth/signin">
            Вернуться к входу
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Загрузка...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
}

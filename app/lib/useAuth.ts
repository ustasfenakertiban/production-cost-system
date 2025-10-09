
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
      });
      router.push('/auth/signin');
      router.refresh();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return {
    logout
  };
}

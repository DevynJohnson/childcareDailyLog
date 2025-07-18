// src/app/auth/page.tsx
import AuthForm from '@/components/AuthForm';

export default function AuthPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{
        // background removed to use global background
      }}
    >
      <AuthForm />
    </main>
  );
}

// src/app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Child Care Daily Log',
  description: 'Real-time caregiver logs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

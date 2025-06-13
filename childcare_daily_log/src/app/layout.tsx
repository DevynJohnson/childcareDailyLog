// src/app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';
import { Toaster } from 'sonner'; // ✅ Import Sonner

export const metadata = { title: 'Child Care Daily Log' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          <main>{children}</main>
          <Toaster richColors position="top-right" /> {/* ✅ Add Sonner Toaster */}
        </AuthProvider>
      </body>
    </html>
  );
}

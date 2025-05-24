// src/app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';

export const metadata = { title: 'Child Care Daily Log' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (<html lang="en"><body><AuthProvider><NavBar /><main>{children}</main></AuthProvider></body></html>
);
}
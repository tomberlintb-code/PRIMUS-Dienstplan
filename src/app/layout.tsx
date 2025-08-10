// src/app/layout.tsx
import '../styles/globals.css'
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PRIMUS Einsatzplanung',
  description: 'Login & Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MAAC Research Dashboard',
  description: 'Real-time monitoring and visualization for MAAC experiments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

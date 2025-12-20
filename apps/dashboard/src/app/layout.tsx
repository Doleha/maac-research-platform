import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { DashboardStateProvider } from '@/contexts/DashboardStateContext';
import { ToastContainer } from '@/components/toast';
import { ErrorBoundary } from '@/components/error-boundary';

export const metadata: Metadata = {
  title: 'MAAC Research Dashboard',
  description: 'Real-time monitoring and visualization for MAAC experiments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden">
        <ErrorBoundary>
          <DashboardStateProvider>
            <NotificationProvider>
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
              <ToastContainer />
            </NotificationProvider>
          </DashboardStateProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

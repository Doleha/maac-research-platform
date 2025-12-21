'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FlaskConical,
  Plus,
  Database,
  Settings,
  BarChart3,
  Layers,
  Activity,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  // Workflow order: Generate → Design → Run → Analyze
  { name: 'Generate Scenarios', href: '/scenarios/generate', icon: Layers },
  { name: 'Design Experiment', href: '/experiments/new', icon: Plus },
  { name: 'Experiments', href: '/experiments', icon: FlaskConical },
  { name: 'Compare Results', href: '/experiments/compare', icon: BarChart3 },
  // Utilities
  { name: 'Data Upload', href: '/data', icon: Database },
  { name: 'Logs', href: '/logs', icon: ScrollText },
  { name: 'System Health', href: '/system', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen w-64 flex-col bg-gray-900 text-white"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-6">
        <h1 className="text-xl font-bold">MAAC Research</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" role="menu">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              role="menuitem"
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <p className="text-xs text-gray-500">v1.0.0 • Open Source</p>
      </div>
    </aside>
  );
}

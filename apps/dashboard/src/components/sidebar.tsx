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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Experiments', href: '/experiments', icon: FlaskConical },
  { name: 'New Experiment', href: '/experiments/new', icon: Plus },
  { name: 'Data Upload', href: '/data', icon: Database },
  { name: 'Scenarios', href: '/scenarios/generate', icon: Layers },
  { name: 'Compare', href: '/experiments/compare', icon: BarChart3 },
  { name: 'System Health', href: '/system', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-6">
        <h1 className="text-xl font-bold">MAAC Research</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <p className="text-xs text-gray-500">v1.0.0 • Open Source</p>
      </div>
    </div>
  );
}

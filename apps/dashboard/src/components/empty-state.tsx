import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="text-center">
        <Icon className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {action.label}
          </button>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}

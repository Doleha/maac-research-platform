'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotification, NotificationType } from '@/contexts/NotificationContext';

const iconMap: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<NotificationType, string> = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
};

const iconColorMap: Record<NotificationType, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
};

export function ToastContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-md flex-col gap-3">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type];
        const colorClass = colorMap[notification.type];
        const iconColorClass = iconColorMap[notification.type];

        return (
          <div
            key={notification.id}
            className={`pointer-events-auto animate-slide-in-right flex items-start gap-3 rounded-lg border p-4 shadow-lg ${colorClass}`}
            role="alert"
            aria-live="polite"
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${iconColorClass}`} />
            <p className="flex-1 text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 rounded p-1 hover:bg-black/5"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Animation styles (add to globals.css)
/*
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
*/

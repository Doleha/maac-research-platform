'use client';

import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComplexityBadgeProps {
  validationPassed?: boolean | null;
  complexityScore?: number | null;
  tier?: 'simple' | 'moderate' | 'complex';
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  onClick?: () => void;
}

/**
 * Badge component showing complexity validation status
 */
export function ComplexityBadge({
  validationPassed,
  complexityScore,
  tier,
  size = 'md',
  showScore = true,
  onClick,
}: ComplexityBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Determine status
  const isValidated = validationPassed !== null && validationPassed !== undefined;
  const isPassed = validationPassed === true;
  const isFailed = validationPassed === false;

  // Status-based styling
  const getStatusStyles = () => {
    if (!isValidated) {
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200',
        Icon: HelpCircle,
        label: 'Not Validated',
      };
    }
    if (isPassed) {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        Icon: CheckCircle,
        label: 'Valid',
      };
    }
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      Icon: XCircle,
      label: 'Failed',
    };
  };

  const status = getStatusStyles();
  const Icon = status.Icon;

  // Tier badge colors
  const tierColors = {
    simple: 'bg-blue-100 text-blue-700',
    moderate: 'bg-yellow-100 text-yellow-700',
    complex: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="flex items-center gap-2">
      {/* Validation Status Badge */}
      <button
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          'inline-flex items-center rounded-full border font-medium transition-colors',
          sizeClasses[size],
          status.bg,
          status.text,
          status.border,
          onClick && 'cursor-pointer hover:opacity-80',
          !onClick && 'cursor-default',
        )}
      >
        <Icon className={iconSizes[size]} />
        <span>{status.label}</span>
        {showScore && complexityScore !== null && complexityScore !== undefined && (
          <span className="font-semibold">({complexityScore.toFixed(1)})</span>
        )}
      </button>

      {/* Tier Badge */}
      {tier && (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            tierColors[tier],
          )}
        >
          {tier}
        </span>
      )}
    </div>
  );
}

/**
 * Compact inline validation indicator
 */
export function ValidationIndicator({
  passed,
  size = 'md',
}: {
  passed?: boolean | null;
  size?: 'sm' | 'md';
}) {
  const iconSizes = { sm: 'h-4 w-4', md: 'h-5 w-5' };

  if (passed === null || passed === undefined) {
    return <HelpCircle className={cn(iconSizes[size], 'text-gray-400')} />;
  }

  if (passed) {
    return <CheckCircle className={cn(iconSizes[size], 'text-green-500')} />;
  }

  return <XCircle className={cn(iconSizes[size], 'text-red-500')} />;
}

/**
 * Tier indicator pill
 */
export function TierPill({ tier }: { tier: 'simple' | 'moderate' | 'complex' }) {
  const colors = {
    simple: 'bg-blue-100 text-blue-800 border-blue-200',
    moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    complex: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium capitalize',
        colors[tier],
      )}
    >
      {tier}
    </span>
  );
}

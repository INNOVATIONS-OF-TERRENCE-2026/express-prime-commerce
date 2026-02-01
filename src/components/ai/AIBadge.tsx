/**
 * AI Badge Component - Displays AI tier and tags on products
 * 
 * @module AIBadge
 * @version 1.0.0
 */

import { cn } from '@/lib/utils';
import { Sparkles, TrendingUp, Star, Zap, Award, Gift } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface AIBadgeProps {
  tier: 'Featured' | 'Trending' | 'Standard';
  tags?: string[];
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'full';
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_CONFIG = {
  Featured: {
    icon: Sparkles,
    label: 'AI Pick',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/30',
  },
  Trending: {
    icon: TrendingUp,
    label: 'Trending',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/30',
  },
  Standard: {
    icon: Star,
    label: 'Quality',
    gradient: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300',
  },
};

const TAG_ICONS: Record<string, typeof Sparkles> = {
  'Premium Pick': Award,
  'Trending': TrendingUp,
  'High Value': Gift,
  'AI Pick': Sparkles,
  'Deal': Zap,
  'Quality': Star,
};

const SIZE_CLASSES = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs',
    icon: 'w-3 h-3',
    gap: 'gap-1',
  },
  md: {
    badge: 'px-2 py-1 text-sm',
    icon: 'w-3.5 h-3.5',
    gap: 'gap-1.5',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base',
    icon: 'w-4 h-4',
    gap: 'gap-2',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AIBadge({
  tier,
  tags = [],
  score,
  showScore = false,
  size = 'sm',
  variant = 'default',
  className,
}: AIBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = config.icon;

  // Minimal variant - just the icon
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          config.bg,
          config.text,
          size === 'sm' ? 'p-1' : size === 'md' ? 'p-1.5' : 'p-2',
          className
        )}
        title={`${config.label}${score ? ` (${Math.round(score * 100)}%)` : ''}`}
      >
        <Icon className={sizeClasses.icon} />
      </div>
    );
  }

  // Full variant - tier + all tags
  if (variant === 'full') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1', className)}>
        {/* Main tier badge */}
        <span
          className={cn(
            'inline-flex items-center rounded-full font-medium',
            sizeClasses.badge,
            sizeClasses.gap,
            config.bg,
            config.text,
            'border',
            config.border
          )}
        >
          <Icon className={sizeClasses.icon} />
          <span>{config.label}</span>
          {showScore && score !== undefined && (
            <span className="opacity-70">
              {Math.round(score * 100)}%
            </span>
          )}
        </span>

        {/* Additional tags */}
        {tags
          .filter((tag) => tag !== config.label && tag !== tier)
          .slice(0, 2)
          .map((tag) => {
            const TagIcon = TAG_ICONS[tag] || Star;
            return (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center rounded-full font-medium',
                  sizeClasses.badge,
                  sizeClasses.gap,
                  'bg-gray-100 text-gray-600 border border-gray-200'
                )}
              >
                <TagIcon className={sizeClasses.icon} />
                <span>{tag}</span>
              </span>
            );
          })}
      </div>
    );
  }

  // Default variant - tier badge only
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses.badge,
        sizeClasses.gap,
        config.bg,
        config.text,
        'border',
        config.border,
        'backdrop-blur-sm',
        className
      )}
    >
      <Icon className={sizeClasses.icon} />
      <span>{config.label}</span>
    </span>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Floating AI badge for product cards
 */
export function AIBadgeFloating({
  tier,
  className,
}: {
  tier: 'Featured' | 'Trending' | 'Standard';
  className?: string;
}) {
  if (tier === 'Standard') return null;

  return (
    <div
      className={cn(
        'absolute top-2 left-2 z-10',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      <AIBadge tier={tier} size="sm" />
    </div>
  );
}

/**
 * AI score indicator bar
 */
export function AIScoreBar({
  score,
  showLabel = true,
  className,
}: {
  score: number;
  showLabel?: boolean;
  className?: string;
}) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 75
      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
      : percentage >= 50
        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
        : 'bg-gray-400';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          AI Score
        </span>
      )}
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {percentage}%
      </span>
    </div>
  );
}

/**
 * Loading shimmer for AI badges
 */
export function AIBadgeSkeleton({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full',
        sizeClasses.badge,
        sizeClasses.gap,
        'bg-gray-200 animate-pulse'
      )}
    >
      <span className={cn(sizeClasses.icon, 'bg-gray-300 rounded')} />
      <span className="w-12 h-3 bg-gray-300 rounded" />
    </span>
  );
}

export default AIBadge;

/**
 * AI Trust Strip - Immediate Reassurance Below Hero
 * 
 * Icon-first trust signals that are ALWAYS visible above the fold.
 * Psychology: Reduce anxiety before any product interaction.
 * 
 * @component AITrustStrip
 * @version 1.0.0
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  RotateCcw,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface TrustItem {
  icon: React.ReactNode;
  label: string;
  description?: string;
}

interface AITrustStripProps {
  variant?: 'default' | 'compact' | 'expanded';
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    label: 'AI-Curated Products',
    description: 'Selected by intelligence',
  },
  {
    icon: <Truck className="w-5 h-5" />,
    label: 'Fast Shipping',
    description: '2-5 business days',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    label: 'Secure Checkout',
    description: '256-bit encryption',
  },
  {
    icon: <RotateCcw className="w-5 h-5" />,
    label: '30-Day Guarantee',
    description: 'Easy returns',
  },
];

// ============================================================================
// TRUST ITEM COMPONENT
// ============================================================================

const TrustItemComponent: React.FC<{
  item: TrustItem;
  index: number;
  variant: 'default' | 'compact' | 'expanded';
}> = memo(({ item, index, variant }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
    className={cn(
      'flex items-center gap-3',
      variant === 'expanded' && 'flex-col text-center',
      variant === 'compact' && 'gap-2'
    )}
  >
    <div className={cn(
      'flex items-center justify-center rounded-full',
      'bg-gradient-to-br from-violet-500/10 to-purple-500/10',
      'text-violet-600 dark:text-violet-400',
      variant === 'expanded' ? 'w-12 h-12' : 'w-10 h-10',
      variant === 'compact' && 'w-8 h-8'
    )}>
      {item.icon}
    </div>
    <div className={variant === 'expanded' ? 'space-y-1' : ''}>
      <p className={cn(
        'font-medium text-gray-900 dark:text-white',
        variant === 'compact' ? 'text-xs' : 'text-sm'
      )}>
        {item.label}
      </p>
      {variant === 'expanded' && item.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {item.description}
        </p>
      )}
    </div>
  </motion.div>
));

TrustItemComponent.displayName = 'TrustItemComponent';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AITrustStrip = memo<AITrustStripProps>(({
  variant = 'default',
  className,
}) => {
  return (
    <section className={cn(
      'relative overflow-hidden',
      'bg-white dark:bg-gray-950',
      'border-y border-gray-100 dark:border-gray-800',
      className
    )}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.02] via-transparent to-purple-500/[0.02]" />

      <div className={cn(
        'relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
        variant === 'compact' ? 'py-3' : 'py-5'
      )}>
        <div className={cn(
          'grid gap-6',
          variant === 'expanded' 
            ? 'grid-cols-2 md:grid-cols-4' 
            : 'grid-cols-2 md:grid-cols-4',
          variant === 'compact' && 'gap-4'
        )}>
          {TRUST_ITEMS.map((item, index) => (
            <TrustItemComponent
              key={item.label}
              item={item}
              index={index}
              variant={variant}
            />
          ))}
        </div>

        {/* AI Verification Badge (Desktop) */}
        {variant !== 'compact' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 items-center gap-2 text-xs text-gray-400"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Verified by Express Prime</span>
          </motion.div>
        )}
      </div>
    </section>
  );
});

AITrustStrip.displayName = 'AITrustStrip';

export default AITrustStrip;

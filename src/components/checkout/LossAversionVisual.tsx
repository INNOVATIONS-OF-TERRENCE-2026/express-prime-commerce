/**
 * Loss Aversion Visuals Component
 * 
 * Subtle typographic emphasis on scarcity, NOT red alerts.
 * 
 * Shows:
 * - "Availability may change"
 * - "High demand today"
 * - Subtle, not aggressive
 * 
 * NO countdown timers. NO fake urgency.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users } from 'lucide-react';
import { generateLossAversionCopy } from '@/lib/checkoutPsychology';

// ============================================================================
// TYPES
// ============================================================================

interface LossAversionVisualProps {
  inventoryLevel?: number;
  dailyViews?: number;
  variant?: 'inline' | 'badge' | 'minimal';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const LossAversionVisual: React.FC<LossAversionVisualProps> = ({
  inventoryLevel,
  dailyViews,
  variant = 'inline',
  className = '',
}) => {
  const copy = generateLossAversionCopy(inventoryLevel, dailyViews);
  
  const hasContent = copy.availability || copy.demand || copy.timeContext;
  if (!hasContent) return null;

  // INLINE VARIANT
  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`space-y-1 ${className}`}
      >
        {copy.availability && (
          <div className="flex items-center gap-1.5 text-sm text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{copy.availability}</span>
          </div>
        )}
        {copy.demand && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{copy.demand}</span>
          </div>
        )}
      </motion.div>
    );
  }

  // BADGE VARIANT
  if (variant === 'badge') {
    const primaryMessage = copy.availability || copy.demand;
    if (!primaryMessage) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-full text-xs text-amber-700 ${className}`}
      >
        {copy.availability ? (
          <Clock className="w-3 h-3" />
        ) : (
          <TrendingUp className="w-3 h-3" />
        )}
        <span>{primaryMessage}</span>
      </motion.div>
    );
  }

  // MINIMAL VARIANT
  if (variant === 'minimal') {
    const messages: string[] = [];
    if (copy.availability) messages.push(copy.availability);
    if (copy.demand) messages.push(copy.demand);

    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`text-xs text-slate-500 italic ${className}`}
      >
        {messages.join(' • ')}
      </motion.span>
    );
  }

  return null;
};

// ============================================================================
// DEMAND INDICATOR (Standalone)
// ============================================================================

interface DemandIndicatorProps {
  viewCount: number;
  purchaseCount?: number;
  className?: string;
}

export const DemandIndicator: React.FC<DemandIndicatorProps> = ({
  viewCount,
  purchaseCount,
  className = '',
}) => {
  if (viewCount < 20) return null;

  const demandLevel = viewCount > 100 
    ? 'high' 
    : viewCount > 50 
      ? 'moderate' 
      : 'growing';

  const bgColor = demandLevel === 'high'
    ? 'bg-amber-50'
    : demandLevel === 'moderate'
      ? 'bg-blue-50'
      : 'bg-slate-50';

  const textColor = demandLevel === 'high'
    ? 'text-amber-700'
    : demandLevel === 'moderate'
      ? 'text-blue-700'
      : 'text-slate-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${bgColor} ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <Users className={`w-4 h-4 ${textColor}`} />
        <span className={`text-sm ${textColor}`}>
          {viewCount}+ views today
        </span>
      </div>
      
      {purchaseCount && purchaseCount > 5 && (
        <>
          <span className="text-slate-300">•</span>
          <span className={`text-sm ${textColor}`}>
            {purchaseCount} purchased
          </span>
        </>
      )}
    </motion.div>
  );
};

// ============================================================================
// AVAILABILITY HINT (Product Cards)
// ============================================================================

interface AvailabilityHintProps {
  stockLevel: number;
  className?: string;
}

export const AvailabilityHint: React.FC<AvailabilityHintProps> = ({
  stockLevel,
  className = '',
}) => {
  // Only show for low stock
  if (stockLevel >= 20) return null;

  const message = stockLevel <= 5
    ? 'Only a few left'
    : stockLevel <= 10
      ? 'Limited availability'
      : 'Selling fast';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`text-xs text-amber-600 font-medium ${className}`}
    >
      {message}
    </motion.div>
  );
};

export default LossAversionVisual;

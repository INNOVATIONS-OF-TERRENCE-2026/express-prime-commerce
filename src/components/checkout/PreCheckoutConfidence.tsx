/**
 * Pre-Checkout Confidence Engine Component
 * 
 * Shows AI reassurance copy dynamically:
 * - "High purchase confidence"
 * - "Low return likelihood"
 * - "Frequently completed purchase"
 * 
 * Appears IN the cart, not as a popup.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, TrendingUp, ShieldCheck, Users } from 'lucide-react';
import { 
  generateConfidenceSignals, 
  getReassuranceCopy,
  type ConfidenceSignals 
} from '@/lib/checkoutPsychology';

// ============================================================================
// TYPES
// ============================================================================

interface PreCheckoutConfidenceProps {
  cartValue: number;
  itemCount: number;
  avgItemRating?: number;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PreCheckoutConfidence: React.FC<PreCheckoutConfidenceProps> = ({
  cartValue,
  itemCount,
  avgItemRating,
  className = '',
}) => {
  const [signals, setSignals] = useState<ConfidenceSignals | null>(null);
  const [reassuranceCopy, setReassuranceCopy] = useState<string[]>([]);

  useEffect(() => {
    // Generate confidence signals
    const newSignals = generateConfidenceSignals(cartValue, itemCount, avgItemRating);
    setSignals(newSignals);
    setReassuranceCopy(getReassuranceCopy(newSignals));
  }, [cartValue, itemCount, avgItemRating]);

  if (!signals || reassuranceCopy.length === 0) return null;

  const getIcon = (copy: string) => {
    if (copy.toLowerCase().includes('confidence')) return CheckCircle;
    if (copy.toLowerCase().includes('return')) return ShieldCheck;
    if (copy.toLowerCase().includes('popular') || copy.toLowerCase().includes('frequently')) return Users;
    return TrendingUp;
  };

  const confidenceColor = signals.purchaseConfidence === 'high' 
    ? 'bg-emerald-50 border-emerald-100'
    : signals.purchaseConfidence === 'medium'
      ? 'bg-blue-50 border-blue-100'
      : 'bg-slate-50 border-slate-100';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border p-4 ${confidenceColor} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
          AI Checkout Analysis
        </span>
      </div>

      {/* Confidence Signals */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {reassuranceCopy.map((copy, index) => {
            const Icon = getIcon(copy);
            return (
              <motion.div
                key={copy}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-slate-700">{copy}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Completion Rate Bar */}
      {signals.completionRate > 70 && (
        <div className="mt-4 pt-3 border-t border-slate-200/50">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Purchase completion rate</span>
            <span className="font-medium">{signals.completionRate}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${signals.completionRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PreCheckoutConfidence;

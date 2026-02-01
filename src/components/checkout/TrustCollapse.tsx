/**
 * Trust Collapse Mechanism Component
 * 
 * Inline collapsible trust information - NOT modal.
 * 
 * Shows:
 * - Secure checkout details
 * - Shipping information
 * - Return policy
 * 
 * All expandable INLINE, reducing friction.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  ChevronDown,
  Lock,
  CreditCard,
  Package
} from 'lucide-react';
import { getTrustCollapseData } from '@/lib/checkoutPsychology';

// ============================================================================
// TYPES
// ============================================================================

interface TrustCollapseProps {
  variant?: 'full' | 'compact' | 'icons-only';
  defaultExpanded?: string[];
  className?: string;
}

type TrustItem = 'secureCheckout' | 'shipping' | 'returns';

// ============================================================================
// COMPONENT
// ============================================================================

export const TrustCollapse: React.FC<TrustCollapseProps> = ({
  variant = 'full',
  defaultExpanded = [],
  className = '',
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpanded));
  const data = getTrustCollapseData();

  const toggleExpand = (key: TrustItem) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpanded(newExpanded);
  };

  const getIcon = (key: TrustItem) => {
    switch (key) {
      case 'secureCheckout': return ShieldCheck;
      case 'shipping': return Truck;
      case 'returns': return RotateCcw;
    }
  };

  const items: TrustItem[] = ['secureCheckout', 'shipping', 'returns'];

  // ICONS ONLY VARIANT
  if (variant === 'icons-only') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {items.map((key) => {
          const Icon = getIcon(key);
          const item = data[key];
          return (
            <div
              key={key}
              className="flex items-center gap-1.5 text-slate-500"
              title={item.detail}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs">{item.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // COMPACT VARIANT
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {items.map((key) => {
          const Icon = getIcon(key);
          const item = data[key];
          const isExpanded = expanded.has(key);

          return (
            <motion.button
              key={key}
              onClick={() => toggleExpand(key)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                ${isExpanded 
                  ? 'bg-slate-50 border-slate-200' 
                  : 'bg-white border-slate-100 hover:border-slate-200'
                }
              `}
            >
              <Icon className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-700">{item.label}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </motion.div>
            </motion.button>
          );
        })}

        <AnimatePresence>
          {items.filter(key => expanded.has(key)).map((key) => {
            const item = data[key];
            return (
              <motion.div
                key={`detail-${key}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full text-xs text-slate-500 pl-2 border-l-2 border-slate-100"
              >
                {item.detail}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  // FULL VARIANT (Default)
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((key) => {
        const Icon = getIcon(key);
        const item = data[key];
        const isExpanded = expanded.has(key);

        return (
          <div key={key} className="border border-slate-100 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
                    <p className="text-sm text-slate-600">{item.detail}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// INLINE TRUST BADGES (For checkout button area)
// ============================================================================

export const InlineTrustBadges: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex flex-wrap justify-center gap-4 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Lock className="w-3.5 h-3.5" />
        <span>Secure checkout</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <CreditCard className="w-3.5 h-3.5" />
        <span>Multiple payment options</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Package className="w-3.5 h-3.5" />
        <span>Free shipping over $50</span>
      </div>
    </div>
  );
};

export default TrustCollapse;

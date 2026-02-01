/**
 * Hesitation Detector Component
 * 
 * Monitors:
 * - Scroll pauses
 * - Hover on price
 * - Cart dwell time
 * - Checkout button hovers
 * 
 * Triggers subtle nudge: "Most buyers complete checkout within minutes"
 * NO popups. NO pressure. Just gentle encouragement.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import {
  recordCartEntry,
  recordCartExit,
  recordScrollPause,
  recordCheckoutHover,
  calculateHesitationScore,
  getCheckoutNudge,
  type CheckoutNudge,
} from '@/lib/checkoutPsychology';

// ============================================================================
// TYPES
// ============================================================================

interface HesitationDetectorProps {
  isCartPage?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const HesitationDetector: React.FC<HesitationDetectorProps> = ({
  isCartPage = true,
  className = '',
}) => {
  const [nudge, setNudge] = useState<CheckoutNudge | null>(null);
  const [showNudge, setShowNudge] = useState(false);

  // Track cart entry/exit
  useEffect(() => {
    if (isCartPage) {
      recordCartEntry();
      return () => {
        recordCartExit();
      };
    }
  }, [isCartPage]);

  // Check for hesitation periodically
  useEffect(() => {
    const checkHesitation = () => {
      const score = calculateHesitationScore();
      const newNudge = getCheckoutNudge(score);
      
      if (newNudge && newNudge.priority !== nudge?.priority) {
        setNudge(newNudge);
        setShowNudge(true);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkHesitation, 5000);
    
    // Initial check after 10 seconds
    const timeout = setTimeout(checkHesitation, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [nudge]);

  // Scroll pause detection
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        // Check if scroll position hasn't changed (pause)
        if (Math.abs(window.scrollY - lastScrollY) < 50) {
          recordScrollPause();
        }
        lastScrollY = window.scrollY;
      }, 2000); // 2 second pause threshold
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const getIcon = useCallback(() => {
    switch (nudge?.icon) {
      case 'check-circle': return CheckCircle;
      case 'shield': return Shield;
      case 'clock': return Clock;
      default: return CheckCircle;
    }
  }, [nudge]);

  const dismissNudge = () => {
    setShowNudge(false);
  };

  if (!nudge || !showNudge) return null;

  const Icon = getIcon();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 ${className}`}
      >
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-5 py-3 flex items-center gap-3 max-w-sm">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Icon className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">{nudge.message}</p>
          </div>

          <button
            onClick={dismissNudge}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// HOOK: Track price hover
// ============================================================================

import { startPriceHover, endPriceHover } from '@/lib/checkoutPsychology';

export const usePriceHoverTracking = () => {
  const onPriceEnter = useCallback(() => {
    startPriceHover();
  }, []);

  const onPriceLeave = useCallback(() => {
    endPriceHover();
  }, []);

  return { onPriceEnter, onPriceLeave };
};

// ============================================================================
// HOOK: Track checkout button hover
// ============================================================================

export const useCheckoutHoverTracking = () => {
  const onCheckoutHover = useCallback(() => {
    recordCheckoutHover();
  }, []);

  return { onCheckoutHover };
};

export default HesitationDetector;

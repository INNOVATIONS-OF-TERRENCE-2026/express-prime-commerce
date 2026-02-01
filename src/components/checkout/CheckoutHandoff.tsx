/**
 * Checkout Handoff Component
 * 
 * Clean redirect to Shopify checkout:
 * - No layout jump shock
 * - Visual continuity (branding persists in loading state)
 * - Progress indicator
 * - Trust reinforcement
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, ArrowRight, Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CheckoutHandoffProps {
  checkoutUrl: string;
  isProcessing?: boolean;
  onCheckout?: () => void;
  className?: string;
}

interface CheckoutButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// CHECKOUT BUTTON
// ============================================================================

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        relative w-full py-4 px-6 
        bg-slate-900 hover:bg-slate-800 
        disabled:bg-slate-300 disabled:cursor-not-allowed
        text-white font-medium text-base
        rounded-lg transition-colors
        flex items-center justify-center gap-3
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Preparing checkout...</span>
        </>
      ) : (
        <>
          <Lock className="w-4 h-4" />
          <span>Secure Checkout</span>
          <ArrowRight className="w-4 h-4 ml-auto" />
        </>
      )}
    </motion.button>
  );
};

// ============================================================================
// HANDOFF OVERLAY
// ============================================================================

export const CheckoutHandoffOverlay: React.FC<{ 
  isVisible: boolean;
  brandName?: string;
}> = ({
  isVisible,
  brandName = 'Express Prime',
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center"
        >
          {/* Brand Identity Persistence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center"
          >
            {/* Logo Placeholder */}
            <div className="text-2xl font-bold text-slate-800 mb-2">
              {brandName}
            </div>
            
            {/* Loading State */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              <span className="text-slate-500">Preparing secure checkout...</span>
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'linear' }}
                className="h-full bg-slate-800 rounded-full"
              />
            </div>

            {/* Trust Reassurance */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-bit SSL encrypted checkout</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN HANDOFF COMPONENT
// ============================================================================

export const CheckoutHandoff: React.FC<CheckoutHandoffProps> = ({
  checkoutUrl,
  isProcessing = false,
  onCheckout,
  className = '',
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleCheckout = async () => {
    if (onCheckout) {
      onCheckout();
    }

    setShowOverlay(true);
    setIsRedirecting(true);

    // Brief delay for visual continuity, then redirect
    setTimeout(() => {
      window.location.href = checkoutUrl;
    }, 1500);
  };

  // If external processing state changes
  useEffect(() => {
    if (isProcessing) {
      setShowOverlay(true);
    }
  }, [isProcessing]);

  return (
    <div className={className}>
      <CheckoutButton
        onClick={handleCheckout}
        isLoading={isRedirecting || isProcessing}
        disabled={isRedirecting || isProcessing}
      />

      {/* Trust signals below button */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Secure
        </span>
        <span>•</span>
        <span>Free returns</span>
        <span>•</span>
        <span>Fast shipping</span>
      </div>

      {/* Handoff Overlay */}
      <CheckoutHandoffOverlay isVisible={showOverlay} />
    </div>
  );
};

// ============================================================================
// EXPRESS CHECKOUT CTA (Alternative style)
// ============================================================================

export const ExpressCheckoutCTA: React.FC<{
  onClick: () => void;
  itemCount: number;
  totalPrice: string;
  isLoading?: boolean;
  className?: string;
}> = ({
  onClick,
  itemCount,
  totalPrice,
  isLoading = false,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-900 rounded-xl p-4 ${className}`}
    >
      {/* Summary */}
      <div className="flex justify-between text-white mb-4">
        <span className="text-slate-300">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
        <span className="font-semibold">{totalPrice}</span>
      </div>

      {/* Checkout Button */}
      <motion.button
        onClick={onClick}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 bg-white text-slate-900 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-slate-100"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <span>Complete Purchase</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </motion.button>

      {/* Trust Line */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Secure checkout powered by Shopify</span>
      </div>
    </motion.div>
  );
};

export default CheckoutHandoff;

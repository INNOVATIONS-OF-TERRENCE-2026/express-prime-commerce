/**
 * 8️⃣ FOOTER = SILENT REASSURANCE
 * 
 * Minimal. Clean. Trust-driven. No clutter.
 * 
 * Includes:
 * - Trust icons (Payment methods)
 * - Minimal links (Support, Track Order, Returns)
 * - No newsletter popup
 * - No social media overload
 * - Subtle "Powered by AI" branding
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Truck, RotateCcw, Headphones, Lock } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface FooterLink {
  label: string;
  href: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SilentReassuranceFooter: React.FC = () => {
  const essentialLinks: FooterLink[] = [
    { label: 'Support', href: '/support' },
    { label: 'Track Order', href: '/order-tracking' },
    { label: 'Returns', href: '/policy/returns' },
    { label: 'Shipping', href: '/policy/shipping' },
    { label: 'Privacy', href: '/policy/privacy' },
  ];

  const trustIndicators = [
    { icon: Lock, label: 'Secure' },
    { icon: Shield, label: 'Protected' },
    { icon: Truck, label: 'Fast Shipping' },
    { icon: RotateCcw, label: 'Easy Returns' },
  ];

  return (
    <footer className="bg-slate-50 border-t border-slate-100">
      {/* Trust Strip */}
      <div className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-8">
            {trustIndicators.map((indicator, index) => {
              const Icon = indicator.icon;
              return (
                <motion.div
                  key={indicator.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex items-center gap-2 text-slate-500"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{indicator.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo & AI Badge */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-lg font-semibold text-slate-800">
              Express Prime
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Powered by AI
            </div>
          </div>

          {/* Essential Links Only */}
          <nav className="flex flex-wrap justify-center gap-6">
            {essentialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Support Quick Access */}
          <a
            href="/support"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Headphones className="w-4 h-4" />
            <span>Need Help?</span>
          </a>
        </div>

        {/* Payment Methods (Silent Trust) */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Payment Icons */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">We accept</span>
              <div className="flex gap-2">
                {['Visa', 'MC', 'Amex', 'PayPal'].map((method) => (
                  <div
                    key={method}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-500 font-medium"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>

            {/* Copyright - Minimal */}
            <div className="text-xs text-slate-400">
              © {new Date().getFullYear()} Express Prime. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SilentReassuranceFooter;

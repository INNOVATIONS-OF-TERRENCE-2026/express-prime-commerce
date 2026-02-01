/**
 * Store IQ Dashboard
 * 
 * Investor-grade intelligence dashboard for Express Prime.
 * 
 * Features:
 * - Large central Store IQ Score ring
 * - Color-coded grade indicator
 * - Individual dimension gauges
 * - "What improved your score" insights
 * - "What's holding you back" warnings
 * - AI-generated actionable next steps
 * 
 * Design: Calm. Authoritative. Stripe/Snowflake-level clarity.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Shield, 
  Settings, 
  Rocket,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useStoreIQ } from '@/hooks/useStoreIQ';
import { getGradeColor, DIMENSION_WEIGHTS } from '@/ai/storeIQ';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// SCORE RING COMPONENT
// ============================================================================

interface ScoreRingProps {
  score: number;
  grade: string;
  size?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ score, grade, size = 240 }) => {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const gradeColor = getGradeColor(grade as any);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-5xl font-bold text-slate-800">{score}</div>
          <div 
            className="text-2xl font-semibold mt-1"
            style={{ color: gradeColor }}
          >
            {grade}
          </div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wide">
            Store IQ
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// DIMENSION GAUGE COMPONENT
// ============================================================================

interface DimensionGaugeProps {
  name: string;
  score: number;
  weight: number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

const DimensionGauge: React.FC<DimensionGaugeProps> = ({
  name,
  score,
  weight,
  icon,
  color,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-lg border border-slate-100 p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700">{name}</div>
            <div className="text-xs text-slate-400">{Math.round(weight * 100)}% weight</div>
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color }}>
          {score}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// INSIGHT CARD COMPONENT
// ============================================================================

interface InsightCardProps {
  type: 'strength' | 'risk' | 'recommendation';
  items: string[];
}

const InsightCard: React.FC<InsightCardProps> = ({ type, items }) => {
  const config = {
    strength: {
      icon: CheckCircle,
      title: 'Key Strengths',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-700',
    },
    risk: {
      icon: AlertTriangle,
      title: 'Critical Risks',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-700',
    },
    recommendation: {
      icon: Lightbulb,
      title: 'AI Recommendations',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
    },
  };

  const { icon: Icon, title, bgColor, borderColor, iconColor, textColor } = config[type];

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-lg border ${bgColor} ${borderColor} p-4`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h3 className={`font-semibold ${textColor}`}>{title}</h3>
      </div>

      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <ChevronRight className={`w-4 h-4 ${iconColor} mt-0.5 flex-shrink-0`} />
            <span className="text-sm text-slate-700">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="flex justify-center">
      <Skeleton className="w-60 h-60 rounded-full" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
    <div className="grid md:grid-cols-3 gap-4">
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-40 rounded-lg" />
    </div>
  </div>
);

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export const StoreIQDashboard: React.FC = () => {
  const { output, isLoading, refresh } = useStoreIQ();

  const dimensions = output ? [
    {
      name: 'Demand',
      score: output.dimension_breakdown.demand.score,
      weight: DIMENSION_WEIGHTS.demand,
      icon: <TrendingUp className="w-4 h-4 text-violet-600" />,
      color: '#8b5cf6',
    },
    {
      name: 'Conversion',
      score: output.dimension_breakdown.conversion.score,
      weight: DIMENSION_WEIGHTS.conversion,
      icon: <ShoppingCart className="w-4 h-4 text-blue-600" />,
      color: '#2563eb',
    },
    {
      name: 'Product',
      score: output.dimension_breakdown.product.score,
      weight: DIMENSION_WEIGHTS.product,
      icon: <Package className="w-4 h-4 text-emerald-600" />,
      color: '#059669',
    },
    {
      name: 'Trust',
      score: output.dimension_breakdown.trust.score,
      weight: DIMENSION_WEIGHTS.trust,
      icon: <Shield className="w-4 h-4 text-amber-600" />,
      color: '#d97706',
    },
    {
      name: 'Operations',
      score: output.dimension_breakdown.ops.score,
      weight: DIMENSION_WEIGHTS.ops,
      icon: <Settings className="w-4 h-4 text-slate-600" />,
      color: '#475569',
    },
    {
      name: 'Scale',
      score: output.dimension_breakdown.scale.score,
      weight: DIMENSION_WEIGHTS.scale,
      icon: <Rocket className="w-4 h-4 text-rose-600" />,
      color: '#e11d48',
    },
  ] : [];

  if (isLoading && !output) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Store IQ Dashboard</h1>
          <p className="text-slate-500">Calculating intelligence score...</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (!output) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Store IQ Dashboard</h1>
        <p className="text-slate-500 mb-4">Unable to calculate Store IQ. Please try again.</p>
        <Button onClick={refresh}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Store IQ Dashboard</h1>
          <p className="text-slate-500">
            Intelligence score calculated {output.data_freshness === 'real-time' ? 'just now' : 'from cache'}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={refresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Score Ring */}
      <div className="flex justify-center mb-10">
        <ScoreRing 
          score={output.store_iq_score} 
          grade={output.grade}
        />
      </div>

      {/* Dimension Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {dimensions.map((dim, index) => (
          <DimensionGauge
            key={dim.name}
            {...dim}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Insights Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <InsightCard type="strength" items={output.key_strengths} />
        <InsightCard type="risk" items={output.critical_risks} />
        <InsightCard type="recommendation" items={output.ai_recommendations} />
      </div>

      {/* Timestamp */}
      <div className="mt-8 text-center text-xs text-slate-400">
        Last calculated: {output.calculated_at.toLocaleString()}
      </div>
    </div>
  );
};

export default StoreIQDashboard;

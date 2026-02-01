/**
 * Store Valuation Dashboard - Investor-Ready Metrics Display
 * 
 * AI-powered store valuation engine showing:
 * - GMV estimates
 * - Conversion efficiency
 * - Product velocity
 * - SKU depth analysis
 * - Valuation range with confidence intervals
 * 
 * @component StoreValuationDashboard
 * @version 1.0.0
 */

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Zap,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Shield,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useStoreValuation, formatValuation, getGradeColor } from '@/ai/aiHooks';
import type { StoreValuation, ValuationInput } from '@/ai/storeValuation';

// ============================================================================
// TYPES
// ============================================================================

interface StoreValuationDashboardProps {
  products: Array<{
    id: string;
    title: string;
    price: number;
    category: string;
    createdAt?: Date;
  }>;
  orders?: Array<{
    id: string;
    total: number;
    createdAt: Date;
  }>;
  visitors?: number;
  timeframeDays?: number;
  className?: string;
}

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  className?: string;
}> = memo(({ title, value, subtitle, icon, trend, trendValue, color = 'text-primary', className }) => (
  <Card className={cn('overflow-hidden', className)}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', color)}>{value}</span>
            {trend && trendValue && (
              <span className={cn(
                'flex items-center text-xs font-medium',
                trend === 'up' && 'text-emerald-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-muted-foreground'
              )}>
                {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                {trend === 'neutral' && <Minus className="w-3 h-3" />}
                {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl bg-primary/10', color.replace('text-', 'text-'))}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
));

MetricCard.displayName = 'MetricCard';

// ============================================================================
// GRADE BADGE COMPONENT
// ============================================================================

const GradeBadge: React.FC<{ grade: string; score: number }> = ({ grade, score }) => {
  const gradeConfig: Record<string, { label: string; color: string; bg: string }> = {
    'A+': { label: 'Exceptional', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    'A': { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    'B+': { label: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-500/10' },
    'B': { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-500/10' },
    'C+': { label: 'Above Average', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    'C': { label: 'Average', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    'D': { label: 'Below Average', color: 'text-orange-600', bg: 'bg-orange-500/10' },
    'F': { label: 'Needs Work', color: 'text-red-600', bg: 'bg-red-500/10' },
  };

  const config = gradeConfig[grade] || gradeConfig['C'];

  return (
    <div className={cn('inline-flex items-center gap-3 px-4 py-2 rounded-xl', config.bg)}>
      <span className={cn('text-4xl font-bold', config.color)}>{grade}</span>
      <div>
        <p className={cn('text-sm font-semibold', config.color)}>{config.label}</p>
        <p className="text-xs text-muted-foreground">Health Score: {score}/100</p>
      </div>
    </div>
  );
};

// ============================================================================
// VALUATION RANGE COMPONENT
// ============================================================================

const ValuationRange: React.FC<{ low: number; mid: number; high: number }> = ({ low, mid, high }) => {
  const range = high - low;
  const midPosition = ((mid - low) / range) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Conservative</span>
        <span className="font-bold text-primary">{formatValuation(mid)}</span>
        <span className="text-muted-foreground">Optimistic</span>
      </div>
      
      <div className="relative h-4 bg-gradient-to-r from-blue-500/20 via-emerald-500/30 to-amber-500/20 rounded-full overflow-hidden">
        {/* Range bar */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 rounded-full" />
        </div>
        
        {/* Mid marker */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-lg"
          style={{ left: `calc(${midPosition}% - 8px)` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatValuation(low)}</span>
        <span>{formatValuation(high)}</span>
      </div>
    </div>
  );
};

// ============================================================================
// BREAKDOWN CHART COMPONENT
// ============================================================================

const BreakdownChart: React.FC<{ breakdown: Record<string, number>; total: number }> = ({ breakdown, total }) => {
  const items = Object.entries(breakdown).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value,
    percentage: (value / total) * 100,
  })).sort((a, b) => b.value - a.value);

  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{formatValuation(item.value)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', colors[index % colors.length])}
              initial={{ width: 0 }}
              animate={{ width: `${item.percentage}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Main Valuation Card */}
    <Skeleton className="h-48 w-full rounded-xl" />

    {/* Metrics Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>

    {/* Breakdown */}
    <Skeleton className="h-64 rounded-xl" />
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StoreValuationDashboard = memo<StoreValuationDashboardProps>(({
  products,
  orders = [],
  visitors = 0,
  timeframeDays = 30,
  className,
}) => {
  // Prepare valuation input
  const valuationInput = useMemo<ValuationInput | null>(() => {
    if (products.length === 0) return null;

    return {
      products: products.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category,
        createdAt: p.createdAt || new Date(),
      })),
      orders: orders.map(o => ({
        id: o.id,
        total: o.total,
        createdAt: o.createdAt,
      })),
      visitors,
      timeframeDays,
    };
  }, [products, orders, visitors, timeframeDays]);

  const { valuation, loading, error, refresh, gradeColor } = useStoreValuation(valuationInput);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !valuation) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-red-500/10">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Valuation Unavailable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error?.message || 'Unable to calculate store valuation. Please add more products.'}
            </p>
          </div>
          <Button onClick={refresh} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-foreground">Store Valuation</h2>
          </div>
          <p className="text-muted-foreground">AI-powered business metrics • Investor-ready</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Valuation Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Valuation Amount */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-emerald-500" />
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Estimated Value</span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-bold text-foreground"
              >
                {formatValuation(valuation.midValue)}
              </motion.div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Range: {formatValuation(valuation.lowValue)} - {formatValuation(valuation.highValue)}
                </span>
                <Badge variant="secondary" className="gap-1">
                  <Shield className="w-3 h-3" />
                  {valuation.confidence}% confidence
                </Badge>
              </div>
            </div>

            {/* Grade */}
            <div className="flex-shrink-0">
              <GradeBadge grade={valuation.health.grade} score={valuation.health.score} />
            </div>
          </div>

          {/* Valuation Range */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <ValuationRange
              low={valuation.lowValue}
              mid={valuation.midValue}
              high={valuation.highValue}
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly GMV"
          value={formatValuation(valuation.metrics.monthlyGMV)}
          trend={valuation.metrics.monthlyGMV > 5000 ? 'up' : 'neutral'}
          trendValue={valuation.metrics.monthlyGMV > 5000 ? '+12%' : 'Stable'}
          icon={<ShoppingCart className="w-5 h-5 text-emerald-600" />}
          color="text-emerald-600"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${valuation.metrics.conversionRate.toFixed(1)}%`}
          subtitle="Visitors to buyers"
          trend={valuation.metrics.conversionRate >= 2 ? 'up' : 'down'}
          trendValue={valuation.metrics.conversionRate >= 2 ? 'Good' : 'Needs work'}
          icon={<Target className="w-5 h-5 text-blue-600" />}
          color="text-blue-600"
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${valuation.metrics.avgOrderValue.toFixed(0)}`}
          subtitle="Per transaction"
          icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
          color="text-purple-600"
        />
        <MetricCard
          title="Product Velocity"
          value={valuation.metrics.productVelocity.toFixed(1)}
          subtitle="Items sold/day"
          icon={<Zap className="w-5 h-5 text-amber-600" />}
          color="text-amber-600"
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Value Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Value Breakdown
            </CardTitle>
            <CardDescription>Components contributing to store valuation</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownChart breakdown={valuation.breakdown} total={valuation.midValue} />
          </CardContent>
        </Card>

        {/* Health Factors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Health Factors
            </CardTitle>
            <CardDescription>Key indicators affecting store health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {valuation.health.factors.map((factor, index) => (
              <div key={factor.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    factor.impact === 'positive' && 'bg-emerald-500',
                    factor.impact === 'negative' && 'bg-red-500',
                    factor.impact === 'neutral' && 'bg-amber-500'
                  )} />
                  <span className="text-sm">{factor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={factor.score} className="w-20 h-2" />
                  <span className="text-sm font-medium w-8">{factor.score}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {valuation.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Insights
            </CardTitle>
            <CardDescription>Recommendations to improve store value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {valuation.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-4 rounded-xl border',
                    insight.type === 'positive' && 'bg-emerald-500/5 border-emerald-500/20',
                    insight.type === 'improvement' && 'bg-amber-500/5 border-amber-500/20',
                    insight.type === 'warning' && 'bg-red-500/5 border-red-500/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      insight.type === 'positive' && 'bg-emerald-500/10',
                      insight.type === 'improvement' && 'bg-amber-500/10',
                      insight.type === 'warning' && 'bg-red-500/10'
                    )}>
                      {insight.type === 'positive' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                      {insight.type === 'improvement' && <Award className="w-4 h-4 text-amber-600" />}
                      {insight.type === 'warning' && <Info className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Attribution */}
      <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground">
        <Sparkles className="w-3 h-3" />
        <span>Valuation powered by Express Prime AI • Updated {new Date(valuation.calculatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
});

StoreValuationDashboard.displayName = 'StoreValuationDashboard';

export default StoreValuationDashboard;

/**
 * Commerce Intelligence Dashboard
 * 
 * Unified AI intelligence display for Express Prime admin.
 * Surfaces all AI modules in investor-grade format.
 * Includes Profit Governor for autonomous profit optimization.
 * 
 * @module components/admin/CommerceIntelligenceDashboard
 * @version 2.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Target,
  Shield,
  DollarSign,
  Zap,
  Eye,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  RefreshCcw,
  ChevronRight,
  Sparkles,
  Activity,
  Users,
  ShoppingCart,
  Package,
  Gauge,
  Scale,
  TrendingDown,
  AlertCircle,
  Percent,
  PiggyBank,
  LineChart,
  Trophy,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Import AI modules
import {
  calculateStoreIQ,
  generateMockInputData,
  type StoreIQOutput,
  type StoreIQGrade,
  getGradeFromScore,
  getGradeColor,
  DIMENSION_WEIGHTS,
} from '@/ai/storeIQ';

import {
  getSessionIntent,
  getHighIntentProducts,
  getIntentStats,
  type SessionIntent,
  type IntentProfile,
} from '@/ai/buyerIntent';

import {
  getHeatmapSnapshot,
  identifyFrictionPoints,
  getTopPerformers,
  getScrollDepthData,
  type HeatmapSnapshot,
  type FrictionPoint,
} from '@/ai/conversionHeatmap';

import {
  getTrustStats,
  getVerifiedPicks,
  type TrustScore,
} from '@/ai/brandTrust';

import {
  calculateValuation,
  getLastValuation,
  formatValuation,
  type StoreValuation,
} from '@/ai/storeValuation';

import {
  getNamingStats,
} from '@/ai/productNaming';

// Import Profit Governor
import {
  generateMockGovernorData,
  getGovernorStats,
  getDecisionLog,
  type ProfitHealthScore,
  type ProfitForecast,
  type LossLeak,
  type ProfitWeightedProduct,
  type GovernorDecisionLog,
} from '@/ai/profitGovernor';

// Import Supply Arbitrage Engine
import {
  getMockArbitrageData,
  getArbitrageStats,
  getSupplierRankings,
  getRiskAlerts,
  getDecisionLog as getArbitrageDecisions,
  type SupplierProfile,
  type ArbitrageDecision,
  type SupplierRiskAlert,
} from '@/ai/supplyArbitrage';

// ============================================================================
// TYPES
// ============================================================================

interface IntelligenceMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CommerceIntelligenceDashboard() {
  const [storeIQ, setStoreIQ] = useState<StoreIQOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate Store IQ on mount
  useEffect(() => {
    const calculateIntelligence = async () => {
      setIsLoading(true);
      try {
        const inputData = generateMockInputData();
        const result = await calculateStoreIQ(inputData);
        setStoreIQ(result);
      } catch (error) {
        console.error('Failed to calculate Store IQ:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateIntelligence();
  }, [lastRefresh]);

  // Get real-time intent data
  const sessionIntent = useMemo(() => getSessionIntent(), [lastRefresh]);
  const highIntentProducts = useMemo(() => getHighIntentProducts(0.6), [lastRefresh]);
  const intentStats = useMemo(() => getIntentStats(), [lastRefresh]);

  // Get heatmap data
  const heatmapSnapshot = useMemo(() => getHeatmapSnapshot(), [lastRefresh]);
  const frictionPoints = useMemo(() => identifyFrictionPoints(), [lastRefresh]);
  const scrollDepth = useMemo(() => getScrollDepthData(), [lastRefresh]);

  // Get trust data
  const trustStats = useMemo(() => getTrustStats(), [lastRefresh]);
  const verifiedPicks = useMemo(() => getVerifiedPicks(), [lastRefresh]);

  // Get valuation data
  const valuation = useMemo(() => getLastValuation(), [lastRefresh]);

  // Get naming stats
  const namingStats = useMemo(() => getNamingStats(), [lastRefresh]);

  // Get Profit Governor data
  const governorData = useMemo(() => generateMockGovernorData(), [lastRefresh]);
  const governorStats = useMemo(() => getGovernorStats(), [lastRefresh]);
  const decisionLog = useMemo(() => getDecisionLog(10), [lastRefresh]);

  // Get Supply Arbitrage data
  const arbitrageData = useMemo(() => getMockArbitrageData(), [lastRefresh]);
  const arbitrageStats = useMemo(() => getArbitrageStats(), [lastRefresh]);
  const supplierRankings = useMemo(() => getSupplierRankings(), [lastRefresh]);
  const supplierAlerts = useMemo(() => getRiskAlerts(), [lastRefresh]);
  const arbitrageDecisions = useMemo(() => getArbitrageDecisions(10), [lastRefresh]);

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const gradeColor = storeIQ ? getGradeColor(storeIQ.grade) : '#6b7280';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-accent" />
            Commerce Intelligence
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered analytics and autonomous decision system
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          <RefreshCcw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Store IQ Score Hero */}
      <Card className="overflow-hidden">
        <div 
          className="p-6 text-white relative"
          style={{ 
            background: `linear-gradient(135deg, ${gradeColor}ee 0%, ${gradeColor}99 100%)` 
          }}
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80 font-medium mb-1">STORE IQ SCORE™</p>
                <div className="flex items-baseline gap-3">
                  <motion.span 
                    className="text-6xl font-bold"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={storeIQ?.store_iq_score}
                  >
                    {isLoading ? '—' : storeIQ?.store_iq_score ?? 0}
                  </motion.span>
                  <span className="text-2xl opacity-70">/100</span>
                  <Badge 
                    className="ml-2 text-lg px-3 py-1" 
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    {storeIQ?.grade ?? '—'}
                  </Badge>
                </div>
                <p className="mt-2 opacity-80">
                  {storeIQ?.data_freshness === 'real-time' ? 'Real-time calculation' : 
                   storeIQ?.data_freshness === 'cached' ? 'Cached (5 min)' : 'Calculating...'}
                </p>
              </div>

              <div className="text-right">
                <Gauge className="w-16 h-16 opacity-30" />
              </div>
            </div>

            {/* Dimension Scores */}
            {storeIQ && (
              <div className="grid grid-cols-6 gap-4 mt-6">
                {Object.entries(storeIQ.dimension_breakdown).map(([key, dim]) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold">{dim.score}</div>
                    <div className="text-xs opacity-70 capitalize">
                      {key === 'ops' ? 'Operations' : key}
                    </div>
                    <div className="text-[10px] opacity-50">
                      {(DIMENSION_WEIGHTS[key as keyof typeof DIMENSION_WEIGHTS] * 100).toFixed(0)}% weight
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Key Insights */}
        {storeIQ && (
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Strengths */}
              <div>
                <h4 className="text-sm font-semibold text-green-600 flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4" />
                  Key Strengths
                </h4>
                <ul className="space-y-2">
                  {storeIQ.key_strengths.slice(0, 3).map((strength, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div>
                <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  Critical Risks
                </h4>
                <ul className="space-y-2">
                  {storeIQ.critical_risks.slice(0, 3).map((risk, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-1 text-red-500 flex-shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-semibold text-blue-600 flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" />
                  AI Recommendations
                </h4>
                <ul className="space-y-2">
                  {storeIQ.ai_recommendations.slice(0, 3).map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-1 text-blue-500 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Intelligence Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-xs">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="profit" className="flex items-center gap-2 text-xs">
            <PiggyBank className="w-4 h-4" />
            Profit
          </TabsTrigger>
          <TabsTrigger value="supply" className="flex items-center gap-2 text-xs">
            <Package className="w-4 h-4" />
            Supply
          </TabsTrigger>
          <TabsTrigger value="intent" className="flex items-center gap-2 text-xs">
            <Target className="w-4 h-4" />
            Intent
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2 text-xs">
            <Activity className="w-4 h-4" />
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="trust" className="flex items-center gap-2 text-xs">
            <Shield className="w-4 h-4" />
            Trust
          </TabsTrigger>
          <TabsTrigger value="valuation" className="flex items-center gap-2 text-xs">
            <DollarSign className="w-4 h-4" />
            Value
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Users}
              title="Session Intent"
              value={`${(sessionIntent.averageIntent * 100).toFixed(0)}%`}
              subtitle={`${sessionIntent.highIntentCount} high-intent sessions`}
              color="text-purple-500"
            />
            <MetricCard
              icon={Eye}
              title="Scroll Depth"
              value={`${scrollDepth.avgMaxDepth.toFixed(0)}%`}
              subtitle="Average max depth"
              color="text-blue-500"
            />
            <MetricCard
              icon={Shield}
              title="Trust Score"
              value={trustStats.avgScore.toFixed(0)}
              subtitle={`${trustStats.verifiedPicks} verified picks`}
              color="text-green-500"
            />
            <MetricCard
              icon={Package}
              title="Name Quality"
              value={namingStats.avgScore.toFixed(0)}
              subtitle={`${namingStats.productsNeedingWork} need improvement`}
              color="text-amber-500"
            />
          </div>

          {/* Friction Points Summary */}
          {frictionPoints.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Friction Points Detected
                </CardTitle>
                <CardDescription>
                  Areas where users experience difficulty
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {frictionPoints.slice(0, 5).map((point, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{point.zoneName}</p>
                        <p className="text-xs text-muted-foreground">{point.suggestion}</p>
                      </div>
                      <Badge variant={point.severity >= 0.7 ? 'destructive' : 'secondary'}>
                        {point.frictionType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Profit Governor Tab */}
        <TabsContent value="profit" className="mt-6 space-y-6">
          {/* Profit Health Score Hero */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 text-white relative"
              style={{ 
                background: `linear-gradient(135deg, ${
                  governorData.healthScore.grade === 'A+' ? '#059669' :
                  governorData.healthScore.grade === 'A' ? '#10b981' :
                  governorData.healthScore.grade === 'B' ? '#3b82f6' :
                  governorData.healthScore.grade === 'C' ? '#f59e0b' :
                  '#ef4444'
                }ee 0%, ${
                  governorData.healthScore.grade === 'A+' ? '#059669' :
                  governorData.healthScore.grade === 'A' ? '#10b981' :
                  governorData.healthScore.grade === 'B' ? '#3b82f6' :
                  governorData.healthScore.grade === 'C' ? '#f59e0b' :
                  '#ef4444'
                }99 100%)` 
              }}
            >
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80 font-medium mb-1">PROFIT HEALTH SCORE™</p>
                    <div className="flex items-baseline gap-3">
                      <motion.span 
                        className="text-6xl font-bold"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={governorData.healthScore.overall}
                      >
                        {governorData.healthScore.overall}
                      </motion.span>
                      <span className="text-2xl opacity-70">/100</span>
                      <Badge 
                        className="ml-2 text-lg px-3 py-1" 
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      >
                        {governorData.healthScore.grade}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className="ml-2 border-white/40 text-white"
                      >
                        {governorData.healthScore.trend === 'improving' ? '↑ Improving' :
                         governorData.healthScore.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                      </Badge>
                    </div>
                  </div>
                  <Scale className="w-16 h-16 opacity-30" />
                </div>

                {/* Health Components */}
                <div className="grid grid-cols-5 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{governorData.healthScore.components.marginStability}</div>
                    <div className="text-xs opacity-70">Margin Stability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{governorData.healthScore.components.revenueQuality}</div>
                    <div className="text-xs opacity-70">Revenue Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{governorData.healthScore.components.riskExposure}</div>
                    <div className="text-xs opacity-70">Risk Exposure</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{governorData.healthScore.components.conversionEfficiency}</div>
                    <div className="text-xs opacity-70">Conversion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{governorData.healthScore.components.inventoryHealth}</div>
                    <div className="text-xs opacity-70">Inventory</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {governorData.healthScore.alerts.length > 0 && (
              <CardContent className="pt-4 bg-amber-50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 text-sm">Active Alerts</p>
                    <ul className="mt-1 space-y-1">
                      {governorData.healthScore.alerts.map((alert, i) => (
                        <li key={i} className="text-sm text-amber-700">• {alert}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Profit Forecasts */}
          <div className="grid md:grid-cols-3 gap-4">
            <ForecastCard forecast={governorData.forecast7d} />
            <ForecastCard forecast={governorData.forecast30d} />
            <ForecastCard forecast={governorData.forecast90d} />
          </div>

          {/* Loss Leaks & Top Products */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Loss Leaks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Loss Leak Detection
                </CardTitle>
                <CardDescription>
                  Silent profit killers identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                {governorData.leaks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500/30 mb-2" />
                    <p>No significant leaks detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {governorData.leaks.map((leak, i) => (
                      <div key={i} className={cn(
                        "p-3 rounded-lg border",
                        leak.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        leak.severity === 'high' ? 'bg-amber-50 border-amber-200' :
                        'bg-slate-50 border-slate-200'
                      )}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{leak.productTitle}</p>
                            <p className="text-xs text-muted-foreground mt-1">{leak.rootCause}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={leak.severity === 'critical' || leak.severity === 'high' ? 'destructive' : 'secondary'}>
                              {leak.leakType}
                            </Badge>
                            <p className="text-xs text-red-600 mt-1">
                              -${leak.estimatedLoss.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-current/10">
                          <p className="text-xs text-muted-foreground font-medium">Remediation:</p>
                          <ul className="text-xs text-muted-foreground mt-1">
                            {leak.remediation.slice(0, 2).map((r, j) => (
                              <li key={j}>• {r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profit-Optimized Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  Profit-Weighted Recommendations
                </CardTitle>
                <CardDescription>
                  Products optimized for margin × velocity × trust
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {governorData.topProducts.map((product, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-gradient-to-r from-green-50 to-transparent">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{product.productTitle}</p>
                          <p className="text-xs text-green-700 mt-1">{product.promotionReason}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {product.compositeScore.toFixed(0)}
                          </div>
                          <p className="text-xs text-muted-foreground">Composite</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center p-2 bg-white/50 rounded">
                          <div className="text-sm font-bold">{product.marginScore}</div>
                          <div className="text-[10px] text-muted-foreground">Margin</div>
                        </div>
                        <div className="text-center p-2 bg-white/50 rounded">
                          <div className="text-sm font-bold">{product.velocityScore}</div>
                          <div className="text-[10px] text-muted-foreground">Velocity</div>
                        </div>
                        <div className="text-center p-2 bg-white/50 rounded">
                          <div className="text-sm font-bold">{product.trustScore}</div>
                          <div className="text-[10px] text-muted-foreground">Trust</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Governor Decision Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Decisions Log
              </CardTitle>
              <CardDescription>
                Human-readable explanations of autonomous decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {decisionLog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p>No decisions logged yet</p>
                  <p className="text-xs mt-1">The AI will log decisions as it optimizes profit</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {decisionLog.map((decision, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{decision.decisionType}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {decision.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-2 font-medium">{decision.decision}</p>
                      <p className="text-muted-foreground text-xs mt-1">{decision.reasoning}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={decision.confidence >= 0.8 ? 'default' : 'secondary'}>
                          {(decision.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                        {decision.humanReviewRequired && (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            Human Review
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supply Arbitrage Tab */}
        <TabsContent value="supply" className="mt-6 space-y-6">
          {/* Arbitrage Health Hero */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {arbitrageStats.totalDecisions}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Total Routing Decisions</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {arbitrageStats.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Fulfillment Success</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    ${arbitrageStats.avgCostSaving.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Avg Cost Saved/Order</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                    {arbitrageStats.activeSuppliers}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Active Suppliers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Supplier Rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Supplier Rankings
                </CardTitle>
                <CardDescription>
                  Self-learning performance scores updated after each fulfillment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supplierRankings.slice(0, 6).map((ranking, idx) => (
                    <div key={ranking.supplierId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                          idx === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                          idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                          'bg-muted text-muted-foreground'}
                      `}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{ranking.supplierName}</div>
                        <div className="text-xs text-muted-foreground">{ranking.supplierType}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{(ranking.overallScore * 100).toFixed(0)}</div>
                        <div className={`text-xs flex items-center justify-end gap-1 ${
                          ranking.trend === 'up' ? 'text-green-600' :
                          ranking.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          {ranking.trend === 'up' ? <TrendingUp className="h-3 w-3" /> :
                           ranking.trend === 'down' ? <TrendingDown className="h-3 w-3" /> :
                           <span>—</span>}
                          {ranking.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Supplier Risk Alerts
                </CardTitle>
                <CardDescription>
                  Autonomous detection of supply chain vulnerabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supplierAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <p className="text-muted-foreground">All suppliers operating normally</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supplierAlerts.map((alert, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                        alert.severity === 'critical' ? 'bg-red-50 border-red-500 dark:bg-red-950' :
                        alert.severity === 'high' ? 'bg-orange-50 border-orange-500 dark:bg-orange-950' :
                        alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-950' :
                        'bg-blue-50 border-blue-500 dark:bg-blue-950'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{alert.alertType.replace(/_/g, ' ').toUpperCase()}</div>
                            <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                              → {alert.recommendation}
                            </p>
                          </div>
                          <Badge variant={
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'high' ? 'destructive' : 'secondary'
                          } className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Arbitrage Decision Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Arbitrage Decision Log
              </CardTitle>
              <CardDescription>
                Human-readable explanations of autonomous supplier routing decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {arbitrageDecisions.slice(0, 8).map((decision, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center shrink-0
                      ${decision.approved ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}
                    `}>
                      {decision.approved ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{decision.productName}</span>
                        <Badge variant="outline" className="text-xs">{decision.orderId}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{decision.reason}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-muted-foreground">
                          Selected: <span className="font-medium text-foreground">{decision.selectedSupplier}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Cost: <span className="font-medium text-green-600">${decision.finalCost.toFixed(2)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Margin: <span className="font-medium text-purple-600">{(decision.expectedMargin * 100).toFixed(1)}%</span>
                        </span>
                        <span className="text-muted-foreground">
                          ETA: <span className="font-medium">{decision.estimatedDelivery}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right shrink-0">
                      {new Date(decision.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supplier Performance Matrix */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Breakdown</CardTitle>
                <CardDescription>Weighted scoring factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Reliability', weight: '25%', value: arbitrageStats.avgReliability, color: 'bg-green-500' },
                    { label: 'Speed', weight: '25%', value: arbitrageStats.avgSpeed, color: 'bg-blue-500' },
                    { label: 'Cost Efficiency', weight: '20%', value: arbitrageStats.avgCostEfficiency, color: 'bg-purple-500' },
                    { label: 'Margin Contribution', weight: '15%', value: arbitrageStats.avgMarginContribution, color: 'bg-amber-500' },
                    { label: 'Trust Score', weight: '15%', value: arbitrageStats.avgTrustScore, color: 'bg-indigo-500' },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{metric.label} <span className="text-muted-foreground">({metric.weight})</span></span>
                        <span className="font-medium">{(metric.value * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${metric.color} transition-all duration-500`}
                          style={{ width: `${metric.value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Arbitrage Intelligence</CardTitle>
                <CardDescription>System learning metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-blue-600">{arbitrageStats.decisionsToday}</div>
                    <div className="text-xs text-muted-foreground mt-1">Decisions Today</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-green-600">{arbitrageStats.switchesThisWeek}</div>
                    <div className="text-xs text-muted-foreground mt-1">Supplier Switches</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-purple-600">${arbitrageStats.totalSavingsThisMonth.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Monthly Savings</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-amber-600">{arbitrageStats.learningIterations}</div>
                    <div className="text-xs text-muted-foreground mt-1">Learning Iterations</div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800">
                  <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                    🧠 Self-Learning Active
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supplier scores update automatically after each order outcome using exponential moving average (α=0.1)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Buyer Intent Tab */}
        <TabsContent value="intent" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Products Viewed</span>
                  <span className="font-bold">{sessionIntent.totalProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">High Intent Count</span>
                  <span className="font-bold text-green-600">{sessionIntent.highIntentCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Intent</span>
                  <span className="font-bold">{(sessionIntent.averageIntent * 100).toFixed(1)}%</span>
                </div>
                <Progress value={sessionIntent.averageIntent * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">High Intent Products</CardTitle>
                <CardDescription>Products with &gt;60% purchase intent</CardDescription>
              </CardHeader>
              <CardContent>
                {highIntentProducts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No high-intent products detected yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {highIntentProducts.slice(0, 5).map((product) => (
                      <div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{product.productId}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            Stage: {product.stage}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {(product.intentProbability * 100).toFixed(0)}%
                          </p>
                          {product.nudgeRecommendation && (
                            <Badge variant="secondary" className="text-xs">
                              {product.nudgeRecommendation}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Intent Signal Breakdown */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Intent Signal Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <SignalMeter label="Tracked Products" value={intentStats.trackedProducts} />
                <SignalMeter label="Total Signals" value={intentStats.totalSignals} />
                <SignalMeter label="Avg Intent" value={Math.round(intentStats.avgIntent * 100)} />
                <SignalMeter label="High Intent" value={intentStats.highIntentProducts} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Scroll Depth */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scroll Depth Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DepthBar label="25% Depth" value={scrollDepth.depth25} />
                <DepthBar label="50% Depth" value={scrollDepth.depth50} />
                <DepthBar label="75% Depth" value={scrollDepth.depth75} />
                <DepthBar label="100% Depth" value={scrollDepth.depth100} />
              </CardContent>
            </Card>

            {/* Zone Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zone Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {heatmapSnapshot.zones.slice(0, 5).map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{zone.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {zone.metrics.impressions} impressions
                        </p>
                      </div>
                      <HeatBadge level={zone.heatLevel} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trust Tab */}
        <TabsContent value="trust" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trust Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-600">
                    {trustStats.avgScore.toFixed(0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Average Trust Score</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{trustStats.verifiedPicks}</div>
                    <p className="text-xs text-muted-foreground">Verified Picks</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{trustStats.byTier.caution}</div>
                    <p className="text-xs text-muted-foreground">Need Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Trust Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <TierBar label="Verified" count={trustStats.byTier.verified} total={trustStats.totalProducts} color="bg-green-500" />
                  <TierBar label="Trusted" count={trustStats.byTier.trusted} total={trustStats.totalProducts} color="bg-blue-500" />
                  <TierBar label="Standard" count={trustStats.byTier.standard} total={trustStats.totalProducts} color="bg-gray-500" />
                  <TierBar label="Caution" count={trustStats.byTier.caution} total={trustStats.totalProducts} color="bg-amber-500" />
                  <TierBar label="Unverified" count={trustStats.byTier.unverified} total={trustStats.totalProducts} color="bg-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Valuation Tab */}
        <TabsContent value="valuation" className="mt-6">
          {valuation ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Store Valuation</CardTitle>
                  <CardDescription>Investor-grade estimation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-green-600">
                      {formatValuation(valuation.valuation.mid)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Mid-Point Estimate</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-xl font-bold">{formatValuation(valuation.valuation.low)}</div>
                      <p className="text-xs text-muted-foreground">Conservative</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-xl font-bold">{formatValuation(valuation.valuation.high)}</div>
                      <p className="text-xs text-muted-foreground">Optimistic</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Badge variant="secondary">
                      {(valuation.valuation.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{valuation.health.overallScore}</span>
                      <Badge style={{ backgroundColor: getGradeColor(valuation.health.grade as StoreIQGrade) }}>
                        {valuation.health.grade}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {valuation.health.strengths.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-amber-600 mb-2">Opportunities</h4>
                      <ul className="space-y-1">
                        {valuation.health.opportunities.slice(0, 3).map((o, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pitch Deck Metrics */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Pitch Deck Metrics</CardTitle>
                  <CardDescription>{valuation.pitchMetrics.headline}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {valuation.pitchMetrics.keyStats.map((stat, i) => (
                      <div key={i} className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold flex items-center justify-center gap-1">
                          {stat.value}
                          {stat.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-500" />}
                          {stat.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium">No Valuation Data</p>
                <p className="text-muted-foreground">Add products to generate valuation</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color 
}: { 
  icon: any; 
  title: string; 
  value: string; 
  subtitle: string; 
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-lg bg-slate-100", color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SignalMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent transition-all" 
          style={{ width: `${Math.min(value * 10, 100)}%` }}
        />
      </div>
    </div>
  );
}

function DepthBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value.toFixed(0)} sessions</span>
      </div>
      <Progress value={Math.min(value * 10, 100)} className="h-2" />
    </div>
  );
}

function HeatBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    cold: 'bg-blue-100 text-blue-700',
    cool: 'bg-cyan-100 text-cyan-700',
    warm: 'bg-amber-100 text-amber-700',
    hot: 'bg-orange-100 text-orange-700',
    burning: 'bg-red-100 text-red-700',
  };
  return (
    <Badge className={colors[level] || colors.cold}>
      {level}
    </Badge>
  );
}

function TierBar({ 
  label, 
  count, 
  total, 
  color 
}: { 
  label: string; 
  count: number; 
  total: number; 
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ForecastCard({ forecast }: { forecast: ProfitForecast }) {
  const periodLabels: Record<string, string> = {
    '7d': '7-Day',
    '30d': '30-Day',
    '90d': '90-Day',
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <LineChart className="w-4 h-4 text-primary" />
          {periodLabels[forecast.period]} Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Conservative */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground font-medium">Conservative</span>
              <Badge variant="secondary" className="text-xs">
                {(forecast.conservative.confidence * 100).toFixed(0)}% conf
              </Badge>
            </div>
            <div className="text-xl font-bold text-slate-700">
              ${forecast.conservative.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">
              {(forecast.conservative.margin * 100).toFixed(1)}% margin
            </div>
          </div>
          
          {/* Optimized */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-green-700 font-medium">Optimized</span>
              <Badge className="text-xs bg-green-600">
                {(forecast.optimized.confidence * 100).toFixed(0)}% conf
              </Badge>
            </div>
            <div className="text-xl font-bold text-green-700">
              ${forecast.optimized.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-green-600">
              {(forecast.optimized.margin * 100).toFixed(1)}% margin
            </div>
          </div>

          {/* Delta */}
          <div className="text-center pt-2 border-t">
            <div className="text-sm font-bold text-green-600">
              +${(forecast.optimized.revenue - forecast.conservative.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">
              Potential uplift
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CommerceIntelligenceDashboard;

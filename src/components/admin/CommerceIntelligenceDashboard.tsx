/**
 * Commerce Intelligence Dashboard
 * 
 * Unified AI intelligence display for Express Prime admin.
 * Surfaces all AI modules in investor-grade format.
 * 
 * @module components/admin/CommerceIntelligenceDashboard
 * @version 1.0.0
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
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="intent" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Buyer Intent
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="trust" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Trust
          </TabsTrigger>
          <TabsTrigger value="valuation" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Valuation
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
              subtitle={`${trustStats.verifiedCount} verified picks`}
              color="text-green-500"
            />
            <MetricCard
              icon={Package}
              title="Name Quality"
              value={namingStats.avgScore.toFixed(0)}
              subtitle={`${namingStats.needsImprovement} need improvement`}
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
                      <Badge variant={point.severity === 'high' ? 'destructive' : 'secondary'}>
                        {point.frictionType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                <SignalMeter label="Hover Engagement" value={intentStats.signals.hover} />
                <SignalMeter label="Attention Score" value={intentStats.signals.attention} />
                <SignalMeter label="Click Engagement" value={intentStats.signals.clicks} />
                <SignalMeter label="Cart Interaction" value={intentStats.signals.cartHovers} />
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
                    <div className="text-2xl font-bold text-green-600">{trustStats.verifiedCount}</div>
                    <p className="text-xs text-muted-foreground">Verified Picks</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{trustStats.cautionCount}</div>
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
                  <TierBar label="Verified" count={trustStats.tierDistribution.verified} total={trustStats.totalProducts} color="bg-green-500" />
                  <TierBar label="Trusted" count={trustStats.tierDistribution.trusted} total={trustStats.totalProducts} color="bg-blue-500" />
                  <TierBar label="Standard" count={trustStats.tierDistribution.standard} total={trustStats.totalProducts} color="bg-gray-500" />
                  <TierBar label="Caution" count={trustStats.tierDistribution.caution} total={trustStats.totalProducts} color="bg-amber-500" />
                  <TierBar label="Unverified" count={trustStats.tierDistribution.unverified} total={trustStats.totalProducts} color="bg-red-500" />
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

export default CommerceIntelligenceDashboard;

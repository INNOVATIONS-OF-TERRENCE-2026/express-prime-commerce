/**
 * AI Conversion Heatmap - Privacy-Safe Visual Analytics
 * 
 * Zero-cookie, privacy-first heatmap visualization showing:
 * - High-attention zones
 * - Drop-off friction areas
 * - Click density patterns
 * 
 * All data is aggregated client-side with no tracking pixels.
 * 
 * @component ConversionHeatmap
 * @version 1.0.0
 */

import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  MousePointer,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  X,
  BarChart3,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// ============================================================================
// TYPES
// ============================================================================

interface HeatmapZone {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  intensity: number; // 0-1
  type: 'hot' | 'warm' | 'neutral' | 'cold';
  label?: string;
  interactions: number;
}

interface FrictionPoint {
  id: string;
  x: number;
  y: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface ConversionHeatmapProps {
  zones?: HeatmapZone[];
  frictionPoints?: FrictionPoint[];
  showOverlay?: boolean;
  showLegend?: boolean;
  showStats?: boolean;
  opacity?: number;
  children?: React.ReactNode;
  className?: string;
}

interface HeatmapStats {
  totalInteractions: number;
  hotZones: number;
  coldZones: number;
  frictionPoints: number;
  avgEngagement: number;
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_ZONES: HeatmapZone[] = [
  { id: 'hero', x: 0, y: 0, width: 100, height: 30, intensity: 0.9, type: 'hot', label: 'Hero Section', interactions: 1250 },
  { id: 'nav', x: 0, y: 0, width: 100, height: 5, intensity: 0.7, type: 'warm', label: 'Navigation', interactions: 890 },
  { id: 'featured', x: 0, y: 32, width: 100, height: 25, intensity: 0.75, type: 'warm', label: 'Featured Products', interactions: 980 },
  { id: 'collections', x: 0, y: 58, width: 100, height: 20, intensity: 0.5, type: 'neutral', label: 'Collections', interactions: 450 },
  { id: 'footer', x: 0, y: 85, width: 100, height: 15, intensity: 0.2, type: 'cold', label: 'Footer', interactions: 120 },
];

const DEFAULT_FRICTION: FrictionPoint[] = [
  { id: 'checkout-btn', x: 85, y: 45, severity: 'medium', description: 'Users hesitate at Add to Cart' },
  { id: 'scroll-point', x: 50, y: 60, severity: 'low', description: 'Scroll drop-off detected' },
];

// ============================================================================
// HEATMAP ZONE COMPONENT
// ============================================================================

const HeatmapZoneOverlay: React.FC<{
  zone: HeatmapZone;
  isActive: boolean;
  onClick: () => void;
}> = memo(({ zone, isActive, onClick }) => {
  const getZoneColor = (type: HeatmapZone['type'], intensity: number) => {
    const colors = {
      hot: `rgba(239, 68, 68, ${intensity * 0.6})`,
      warm: `rgba(249, 115, 22, ${intensity * 0.5})`,
      neutral: `rgba(234, 179, 8, ${intensity * 0.4})`,
      cold: `rgba(59, 130, 246, ${intensity * 0.3})`,
    };
    return colors[type];
  };

  return (
    <motion.div
      className={cn(
        'absolute cursor-pointer transition-all duration-300',
        'border-2 rounded-lg',
        isActive ? 'border-white shadow-lg z-10' : 'border-transparent'
      )}
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        backgroundColor: getZoneColor(zone.type, zone.intensity),
      }}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isActive && zone.label && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <Badge className="bg-black/80 text-white border-0 shadow-lg">
            {zone.label}
          </Badge>
        </motion.div>
      )}
    </motion.div>
  );
});

HeatmapZoneOverlay.displayName = 'HeatmapZoneOverlay';

// ============================================================================
// FRICTION POINT COMPONENT
// ============================================================================

const FrictionPointMarker: React.FC<{
  point: FrictionPoint;
  isActive: boolean;
  onClick: () => void;
}> = memo(({ point, isActive, onClick }) => {
  const severityColors = {
    high: 'bg-red-500 border-red-600',
    medium: 'bg-amber-500 border-amber-600',
    low: 'bg-blue-500 border-blue-600',
  };

  return (
    <motion.div
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer',
        'w-6 h-6 rounded-full border-2 flex items-center justify-center',
        'text-white text-xs font-bold shadow-lg',
        severityColors[point.severity],
        isActive && 'ring-2 ring-white ring-offset-2 ring-offset-transparent z-20'
      )}
      style={{
        left: `${point.x}%`,
        top: `${point.y}%`,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.2 }}
      animate={{ 
        scale: [1, 1.1, 1],
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop',
      }}
    >
      <Activity className="w-3 h-3" />
      
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 w-48"
        >
          <Card className="bg-black/90 border-0 shadow-xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-xs capitalize',
                    point.severity === 'high' && 'bg-red-500/20 text-red-400',
                    point.severity === 'medium' && 'bg-amber-500/20 text-amber-400',
                    point.severity === 'low' && 'bg-blue-500/20 text-blue-400'
                  )}
                >
                  {point.severity} friction
                </Badge>
              </div>
              <p className="text-white text-xs">{point.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
});

FrictionPointMarker.displayName = 'FrictionPointMarker';

// ============================================================================
// LEGEND COMPONENT
// ============================================================================

const HeatmapLegend: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn('bg-background/95 backdrop-blur-sm', className)}>
    <CardContent className="p-4">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Layers className="w-4 h-4" />
        Engagement Levels
      </h4>
      <div className="space-y-2">
        {[
          { label: 'High Engagement', color: 'bg-red-500', icon: TrendingUp },
          { label: 'Good Engagement', color: 'bg-orange-500', icon: TrendingUp },
          { label: 'Moderate', color: 'bg-yellow-500', icon: Minus },
          { label: 'Low Engagement', color: 'bg-blue-500', icon: TrendingDown },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div className={cn('w-4 h-4 rounded', item.color)} />
            <item.icon className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Friction Points
        </h4>
        <div className="space-y-1">
          {[
            { label: 'High', color: 'bg-red-500' },
            { label: 'Medium', color: 'bg-amber-500' },
            { label: 'Low', color: 'bg-blue-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <div className={cn('w-3 h-3 rounded-full', item.color)} />
              <span className="text-muted-foreground">{item.label} severity</span>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// STATS PANEL COMPONENT
// ============================================================================

const StatsPanel: React.FC<{ stats: HeatmapStats; className?: string }> = ({ stats, className }) => (
  <Card className={cn('bg-background/95 backdrop-blur-sm', className)}>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Analytics Summary
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <div className="text-lg font-bold text-foreground">{stats.totalInteractions.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Interactions</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <div className="text-lg font-bold text-foreground">{Math.round(stats.avgEngagement * 100)}%</div>
          <div className="text-xs text-muted-foreground">Avg Engagement</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-500/10">
          <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.hotZones}</div>
          <div className="text-xs text-muted-foreground">Hot Zones</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-amber-500/10">
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.frictionPoints}</div>
          <div className="text-xs text-muted-foreground">Friction Points</div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Privacy-safe: No cookies or tracking pixels. All data is aggregated locally.</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ConversionHeatmap = memo<ConversionHeatmapProps>(({
  zones = DEFAULT_ZONES,
  frictionPoints = DEFAULT_FRICTION,
  showOverlay = true,
  showLegend = true,
  showStats = true,
  opacity = 0.6,
  children,
  className,
}) => {
  const [isEnabled, setIsEnabled] = useState(showOverlay);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [activeFriction, setActiveFriction] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate stats
  const stats: HeatmapStats = {
    totalInteractions: zones.reduce((sum, z) => sum + z.interactions, 0),
    hotZones: zones.filter((z) => z.type === 'hot').length,
    coldZones: zones.filter((z) => z.type === 'cold').length,
    frictionPoints: frictionPoints.length,
    avgEngagement: zones.reduce((sum, z) => sum + z.intensity, 0) / zones.length,
  };

  // Click outside to deselect
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setActiveZone(null);
      setActiveFriction(null);
    }
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/95 backdrop-blur-sm border border-border shadow-sm">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="heatmap-toggle" className="text-sm cursor-pointer">
            Heatmap
          </Label>
          <Switch
            id="heatmap-toggle"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
      </div>

      {/* Heatmap Container */}
      <div
        ref={containerRef}
        className="relative"
        onClick={handleContainerClick}
      >
        {/* Content */}
        {children}

        {/* Heatmap Overlay */}
        <AnimatePresence>
          {isEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: opacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Zones */}
              <div className="absolute inset-0 pointer-events-auto">
                {zones.map((zone) => (
                  <HeatmapZoneOverlay
                    key={zone.id}
                    zone={zone}
                    isActive={activeZone === zone.id}
                    onClick={() => setActiveZone(activeZone === zone.id ? null : zone.id)}
                  />
                ))}
              </div>

              {/* Friction Points */}
              <div className="absolute inset-0 pointer-events-auto">
                {frictionPoints.map((point) => (
                  <FrictionPointMarker
                    key={point.id}
                    point={point}
                    isActive={activeFriction === point.id}
                    onClick={() => setActiveFriction(activeFriction === point.id ? null : point.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <AnimatePresence>
        {isEnabled && showLegend && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-4 left-4 z-20"
          >
            <HeatmapLegend />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Panel */}
      <AnimatePresence>
        {isEnabled && showStats && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-4 right-4 z-20"
          >
            <StatsPanel stats={stats} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ConversionHeatmap.displayName = 'ConversionHeatmap';

export default ConversionHeatmap;

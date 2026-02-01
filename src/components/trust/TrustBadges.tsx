import { Truck, Shield, Lock, Headphones } from 'lucide-react';
import { TRUST_BADGES } from '@/lib/constants';

const iconMap = {
  Truck,
  Shield,
  Lock,
  Headphones,
};

export function TrustBadges() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
      {TRUST_BADGES.map((badge) => {
        const Icon = iconMap[badge.icon as keyof typeof iconMap];
        return (
          <div 
            key={badge.title} 
            className="flex flex-col items-center text-center p-4 rounded-lg bg-white shadow-sm border border-border animate-trust-pulse"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">{badge.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
          </div>
        );
      })}
    </div>
  );
}

export function TrustBadgesCompact() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
      {TRUST_BADGES.map((badge) => {
        const Icon = iconMap[badge.icon as keyof typeof iconMap];
        return (
          <div 
            key={badge.title} 
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Icon className="w-4 h-4 text-primary" />
            <span>{badge.title}</span>
          </div>
        );
      })}
    </div>
  );
}

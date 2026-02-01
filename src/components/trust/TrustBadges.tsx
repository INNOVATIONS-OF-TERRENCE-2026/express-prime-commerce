import { Truck, Shield, Zap, Bot, CreditCard, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const badges = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $49',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: Shield,
    title: 'Secure Checkout',
    description: '256-bit SSL encryption',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Zap,
    title: 'Fast Fulfillment',
    description: '2-3 day delivery',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Bot,
    title: 'AI-Curated',
    description: 'Intelligently selected',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
];

export function TrustBadges({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div 
            key={badge.title}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50',
              'hover:border-accent/30 hover:shadow-lg transition-all duration-300',
              'animate-fade-in-up'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn(
              'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
              badge.bgColor
            )}>
              <Icon className={cn('w-6 h-6', badge.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{badge.title}</h3>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TrustStrip({ className }: { className?: string }) {
  const items = [
    { icon: Truck, text: 'Free Shipping $49+' },
    { icon: Shield, text: 'Secure Checkout' },
    { icon: Zap, text: 'Fast Fulfillment' },
    { icon: Bot, text: 'AI-Curated Products' },
  ];

  return (
    <div className={cn(
      'flex flex-wrap items-center justify-center gap-4 md:gap-8 py-4',
      className
    )}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.text} className="flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4 text-accent" />
            <span className="text-muted-foreground font-medium">{item.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export function TrustBadgesCompact() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-4">
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div key={badge.title} className="flex items-center gap-2">
            <Icon className={cn('w-4 h-4', badge.color)} />
            <span className="text-sm font-medium text-muted-foreground">
              {badge.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withShimmer?: boolean;
}

export function Logo({ 
  variant = 'full', 
  size = 'md', 
  className,
  withShimmer = true
}: LogoProps) {
  const sizeClasses = {
    sm: variant === 'icon' ? 'w-8 h-8' : 'h-8',
    md: variant === 'icon' ? 'w-10 h-10' : 'h-10',
    lg: variant === 'icon' ? 'w-12 h-12' : 'h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  if (variant === 'icon') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        {/* Shield Icon with Cart */}
        <svg 
          viewBox="0 0 48 48" 
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield background */}
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#F5D788" />
              <stop offset="100%" stopColor="#D4AF37" />
            </linearGradient>
          </defs>
          
          {/* Shield outline - gold */}
          <path 
            d="M24 4L6 12V22C6 34.1 14.4 44.9 24 48C33.6 44.9 42 34.1 42 22V12L24 4Z" 
            stroke="url(#goldGradient)"
            strokeWidth="2.5"
            fill="url(#shieldGradient)"
          />
          
          {/* Shopping cart icon */}
          <g transform="translate(11, 14)" stroke="url(#goldGradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Cart body */}
            <path d="M4 4L6 16H22L26 6H8" />
            {/* Speed lines */}
            <line x1="0" y1="6" x2="4" y2="6" />
            <line x1="0" y1="10" x2="3" y2="10" />
            <line x1="0" y1="14" x2="2" y2="14" />
            {/* Wheels */}
            <circle cx="9" cy="20" r="2" fill="url(#goldGradient)" />
            <circle cx="19" cy="20" r="2" fill="url(#goldGradient)" />
            {/* Arrow on cart */}
            <path d="M14 8L20 8M20 8L17 5M20 8L17 11" />
          </g>
        </svg>
        
        {withShimmer && (
          <div className="absolute inset-0 animate-shimmer rounded-full pointer-events-none" />
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Icon */}
      <Logo variant="icon" size={size} withShimmer={withShimmer} />
      
      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className={cn(
          'font-bold tracking-tight text-gradient-gold',
          textSizes[size]
        )}>
          EXPRESS
        </span>
        <span className={cn(
          'font-bold tracking-tight text-primary',
          textSizes[size]
        )}>
          PRIME
        </span>
      </div>
    </div>
  );
}

export function LogoWatermark({ className }: { className?: string }) {
  return (
    <div className={cn('opacity-10', className)}>
      <Logo variant="icon" size="lg" withShimmer={false} />
    </div>
  );
}

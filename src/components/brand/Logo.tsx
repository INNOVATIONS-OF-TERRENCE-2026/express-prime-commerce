import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
    xl: variant === 'icon' ? 'w-16 h-16' : 'h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  if (variant === 'icon') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        <svg 
          viewBox="0 0 48 48" 
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Shield background */}
          <path 
            d="M24 4L6 12V22C6 34.1 14.4 44.9 24 48C33.6 44.9 42 34.1 42 22V12L24 4Z" 
            fill="url(#shieldGradient)"
          />
          
          {/* Shield outline - gold */}
          <path 
            d="M24 4L6 12V22C6 34.1 14.4 44.9 24 48C33.6 44.9 42 34.1 42 22V12L24 4Z" 
            stroke="url(#goldGradient)"
            strokeWidth="2"
            fill="none"
            filter="url(#glow)"
          />
          
          {/* Lightning bolt / speed icon */}
          <g transform="translate(14, 12)" stroke="url(#goldGradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L4 14H10L8 24L18 10H12L14 2H12Z" fill="url(#goldGradient)" stroke="none" />
          </g>
        </svg>
        
        {withShimmer && (
          <div className="absolute inset-0 animate-shimmer rounded-full pointer-events-none" />
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Icon */}
      <Logo variant="icon" size={size} withShimmer={withShimmer} />
      
      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className={cn(
          'font-extrabold tracking-tight text-gradient-gold',
          textSizes[size]
        )}>
          EXPRESS
        </span>
        <span className={cn(
          'font-extrabold tracking-tight text-primary',
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
    <div className={cn('opacity-[0.03]', className)}>
      <Logo variant="icon" size="xl" withShimmer={false} />
    </div>
  );
}

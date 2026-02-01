import { Link } from 'react-router-dom';
import { ArrowRight, Bot, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  productsCount?: number;
}

export function HeroSection({ productsCount = 0 }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background with premium gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-32 lg:py-40 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 mb-8 border border-white/20 ai-badge-glow">
            <Bot className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold text-white">Autonomous AI Commerce Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight animate-fade-in-up">
            <span className="text-white">Smarter Commerce.</span>
            <br />
            <span className="text-gradient-gold">Powered by AI.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Express Prime curates, prices, and scales high-demand products automatically — so you always shop smarter.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 py-6 text-lg btn-glow shadow-2xl shadow-accent/25"
              asChild
            >
              <Link to="/collections?tag=trending">
                <TrendingUp className="w-5 h-5 mr-2" />
                Shop Trending
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white/30 bg-white/5 text-white hover:bg-white hover:text-primary backdrop-blur-sm px-8 py-6 text-lg font-semibold"
              asChild
            >
              <Link to="/collections">
                Browse All Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 md:gap-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <StatItem value={productsCount > 0 ? `${productsCount}+` : '100+'} label="Products" />
            <div className="w-px h-10 bg-white/20" />
            <StatItem value="24/7" label="AI Support" />
            <div className="w-px h-10 bg-white/20" />
            <StatItem value="$49" label="Free Shipping" />
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full" preserveAspectRatio="none">
          <path 
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" 
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-accent">{value}</div>
      <div className="text-sm text-white/60 font-medium">{label}</div>
    </div>
  );
}

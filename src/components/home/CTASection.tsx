import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';

export function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-[#0F172A] text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        {/* Logo watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
          <Logo variant="icon" size="lg" withShimmer={false} className="w-[500px] h-[500px]" />
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/10">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-white/80">Join thousands of smart shoppers</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Ready to Experience{' '}
            <span className="text-gradient-gold">Premium</span>?
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-xl mx-auto">
            Discover AI-curated products, fast shipping, and exceptional quality. Your smarter shopping experience starts here.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-10 py-6 text-lg btn-glow shadow-2xl shadow-accent/25"
              asChild
            >
              <Link to="/collections">
                Start Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white/20 bg-transparent text-white hover:bg-white/10 px-10 py-6 text-lg font-semibold"
              asChild
            >
              <Link to="/collections?tag=trending">
                View Trending
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

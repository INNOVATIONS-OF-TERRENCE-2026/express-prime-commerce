import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Star, Zap, Bot } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/product/ProductGrid';
import { TrustBadges } from '@/components/trust/TrustBadges';
import { Logo } from '@/components/brand/Logo';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { products, isLoading } = useProducts();

  // Filter products by tags
  const trendingProducts = products
    .filter(p => p.tags?.includes('trending'))
    .slice(0, 4);
  
  const bestSellers = products
    .filter(p => p.tags?.includes('bestseller'))
    .slice(0, 4);
  
  const newArrivals = products
    .filter(p => p.tags?.includes('new'))
    .slice(0, 4);

  const smartTech = products
    .filter(p => p.tags?.includes('smart-tech'))
    .slice(0, 4);

  // AI recommended (random selection for demo)
  const aiRecommended = products
    .filter(p => p.tags?.includes('ai-pick'))
    .slice(0, 4);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Bot className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm font-medium">Powered by Autonomous AI Commerce</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gradient-gold">Premium Products</span>
              <br />
              Curated by AI Intelligence
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Discover handpicked, trending products from our AI-powered curation engine. 
              Quality meets innovation at Express Prime.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-semibold px-8 btn-glow"
                asChild
              >
                <Link to="/collections?tag=trending">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Shop Trending Now
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary"
                asChild
              >
                <Link to="/collections">
                  Browse All Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">
                  {products.length}+
                </div>
                <div className="text-sm text-white/70">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">24/7</div>
                <div className="text-sm text-white/70">AI Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">$49</div>
                <div className="text-sm text-white/70">Free Shipping</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path 
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" 
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <TrustBadges />
        </div>
      </section>

      {/* Trending Now */}
      <ProductSection
        title="Trending Now"
        subtitle="Hot products flying off the shelves"
        icon={<TrendingUp className="w-6 h-6 text-[#D4AF37]" />}
        products={trendingProducts}
        isLoading={isLoading}
        viewAllLink="/collections?tag=trending"
      />

      {/* Best Sellers */}
      <ProductSection
        title="Best Sellers"
        subtitle="Customer favorites you'll love"
        icon={<Star className="w-6 h-6 text-[#D4AF37]" />}
        products={bestSellers}
        isLoading={isLoading}
        viewAllLink="/collections?tag=bestseller"
        bgColor="bg-muted/30"
      />

      {/* New Arrivals */}
      <ProductSection
        title="New Drops"
        subtitle="Fresh additions to our collection"
        icon={<Zap className="w-6 h-6 text-green-500" />}
        products={newArrivals}
        isLoading={isLoading}
        viewAllLink="/collections?tag=new"
      />

      {/* Smart Tech */}
      <ProductSection
        title="Smart Tech Finds"
        subtitle="Innovation meets everyday convenience"
        icon={<Sparkles className="w-6 h-6 text-blue-500" />}
        products={smartTech}
        isLoading={isLoading}
        viewAllLink="/collections?tag=smart-tech"
        bgColor="bg-muted/30"
      />

      {/* AI Recommended */}
      <section className="py-16 bg-gradient-to-br from-[#1E3A8A]/5 to-[#D4AF37]/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Bot className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">AI-Recommended For You</h2>
            <p className="text-muted-foreground">
              Our intelligent algorithm curates the perfect products based on trending data and customer preferences.
            </p>
          </div>
          <ProductGrid products={aiRecommended} isLoading={isLoading} />
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="btn-glow">
              <Link to="/collections?tag=ai-pick">
                View All AI Picks
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0F172A] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Logo variant="icon" size="lg" withShimmer={false} className="w-96 h-96 opacity-10" />
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience <span className="text-gradient-gold">Premium</span>?
            </h2>
            <p className="text-white/70 mb-8">
              Join thousands of satisfied customers who trust Express Prime for quality products and exceptional service.
            </p>
            <Button 
              size="lg" 
              className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-semibold px-8 btn-glow"
              asChild
            >
              <Link to="/collections">
                Start Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

// Product Section Component
interface ProductSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  products: any[];
  isLoading: boolean;
  viewAllLink: string;
  bgColor?: string;
}

function ProductSection({ 
  title, 
  subtitle, 
  icon, 
  products, 
  isLoading, 
  viewAllLink,
  bgColor = 'bg-white'
}: ProductSectionProps) {
  return (
    <section className={cn('py-16', bgColor)}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {icon}
              <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            </div>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          <Button asChild variant="ghost" className="hidden md:flex">
            <Link to={viewAllLink}>
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <ProductGrid products={products} isLoading={isLoading} />
        <div className="text-center mt-8 md:hidden">
          <Button asChild variant="outline">
            <Link to={viewAllLink}>
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

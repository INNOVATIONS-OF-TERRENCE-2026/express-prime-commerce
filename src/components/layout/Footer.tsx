import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ArrowRight
} from 'lucide-react';
import { Logo, LogoWatermark } from '@/components/brand/Logo';
import { BRAND, PUBLIC_ROUTES, PRODUCT_CATEGORIES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { href: '/collections', label: 'All Products' },
      { href: '/collections?tag=trending', label: 'Trending Now' },
      { href: '/collections?tag=bestseller', label: 'Best Sellers' },
      { href: '/collections?tag=new', label: 'New Arrivals' },
    ],
    categories: PRODUCT_CATEGORIES.slice(1, 6).map(cat => ({
      href: `/collections?category=${cat.value}`,
      label: cat.label,
    })),
    support: [
      { href: PUBLIC_ROUTES.orderTracking, label: 'Track Your Order' },
      { href: PUBLIC_ROUTES.support, label: 'Contact Support' },
      { href: '/faq', label: 'FAQ' },
      { href: PUBLIC_ROUTES.shipping, label: 'Shipping Info' },
      { href: PUBLIC_ROUTES.refunds, label: 'Returns & Refunds' },
    ],
    company: [
      { href: '/about', label: 'About Us' },
      { href: PUBLIC_ROUTES.terms, label: 'Terms of Service' },
      { href: PUBLIC_ROUTES.privacy, label: 'Privacy Policy' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-[#0F172A] text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Watermark */}
      <div className="absolute bottom-10 right-10 pointer-events-none">
        <LogoWatermark className="w-64 h-64" />
      </div>

      {/* Newsletter Section */}
      <div className="border-b border-white/10 relative">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-3">
              Join the <span className="text-gradient-gold">Express Prime</span> Community
            </h3>
            <p className="text-white/60 mb-8 text-lg">
              Get exclusive deals, early access to new products, and AI-curated recommendations.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl focus:border-accent"
              />
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 h-12 rounded-xl btn-glow whitespace-nowrap">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Logo size="lg" className="mb-6" />
            <p className="text-white/60 text-sm mb-6 max-w-xs leading-relaxed">
              {BRAND.description}. AI-powered product curation meets premium quality.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:border-accent transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-accent mb-5">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map(link => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-white/60 hover:text-white hover:translate-x-1 transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-accent mb-5">Categories</h4>
            <ul className="space-y-3">
              {footerLinks.categories.map(link => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-white/60 hover:text-white hover:translate-x-1 transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-accent mb-5">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map(link => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-white/60 hover:text-white hover:translate-x-1 transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-accent mb-5">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-white/60 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Mail className="w-4 h-4 text-accent" />
                </div>
                <span className="group-hover:text-white transition-colors">{BRAND.email}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Phone className="w-4 h-4 text-accent" />
                </div>
                <span className="group-hover:text-white transition-colors">{BRAND.phone}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/60 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <span className="group-hover:text-white transition-colors">Austin, TX USA</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 relative">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {currentYear} {BRAND.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link to={PUBLIC_ROUTES.privacy} className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to={PUBLIC_ROUTES.terms} className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
            {/* Payment Icons */}
            <div className="flex items-center gap-2">
              {['Visa', 'MC', 'Amex', 'PayPal', 'Apple Pay'].map(payment => (
                <div key={payment} className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-medium border border-white/10">
                  {payment}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

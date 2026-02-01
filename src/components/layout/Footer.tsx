import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube
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
      {/* Watermark */}
      <div className="absolute bottom-10 right-10 pointer-events-none">
        <LogoWatermark className="w-64 h-64" />
      </div>

      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gradient-gold mb-2">
              Join the Express Prime Community
            </h3>
            <p className="text-white/70 mb-6">
              Get exclusive deals, early access to new products, and AI-curated recommendations.
            </p>
            <form className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-semibold px-6 btn-glow">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Logo size="lg" className="mb-4" />
            <p className="text-white/70 text-sm mb-4 max-w-xs">
              {BRAND.description}. AI-powered product curation meets premium quality.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D4AF37] transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-[#D4AF37] mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map(link => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-[#D4AF37] mb-4">Categories</h4>
            <ul className="space-y-2">
              {footerLinks.categories.map(link => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-[#D4AF37] mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map(link => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-[#D4AF37] mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                {BRAND.email}
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                {BRAND.phone}
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                Austin, TX USA
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/50">
              © {currentYear} {BRAND.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <Link to={PUBLIC_ROUTES.privacy} className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to={PUBLIC_ROUTES.terms} className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
            {/* Payment Icons */}
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-white/10 rounded text-xs">Visa</div>
              <div className="px-2 py-1 bg-white/10 rounded text-xs">MC</div>
              <div className="px-2 py-1 bg-white/10 rounded text-xs">Amex</div>
              <div className="px-2 py-1 bg-white/10 rounded text-xs">PayPal</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  X, 
  User,
  ChevronDown,
  Sparkles,
  Bot
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { SearchModal, useSearchModal } from '@/components/search/SearchModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount, openCart } = useCartStore();
  const cartItemCount = itemCount();
  const { user, isAdmin, signOut } = useAuth();
  const { open: searchOpen, setOpen: setSearchOpen } = useSearchModal();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cart bounce animation on count change
  useEffect(() => {
    if (cartItemCount > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 600);
      return () => clearTimeout(timer);
    }
  }, [cartItemCount]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/collections', label: 'Shop All' },
    { href: '/collections?tag=trending', label: 'Trending' },
    { href: '/collections?tag=bestseller', label: 'Best Sellers' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href.split('?')[0]);
  };

  return (
    <>
      <header 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled 
            ? 'glass shadow-lg border-b border-accent/10' 
            : 'bg-white/95'
        )}
      >
        {/* Trust Bar */}
        <div className="bg-gradient-to-r from-primary via-primary to-primary/90 text-white text-center py-2.5 text-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-transparent to-accent/20 animate-shimmer" />
          <span className="relative font-medium">
            🚚 Free Shipping on Orders Over $49 | ⚡ Fast 2-3 Day Delivery
          </span>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group">
              <Logo size="md" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    'hover:bg-primary/5 hover:text-primary',
                    isActive(link.href) 
                      ? 'text-primary bg-primary/5' 
                      : 'text-foreground/70'
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="block h-0.5 mt-1 bg-accent rounded-full" />
                  )}
                </Link>
              ))}

              {/* AI Picks Quick Access */}
              <Link
                to="/collections?tag=ai-pick"
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  'hover:bg-accent/10 text-accent hover:text-accent',
                  'relative'
                )}
              >
                <Bot className="w-4 h-4" />
                <span>AI Picks</span>
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
              </Link>

              {/* Categories Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    'hover:bg-primary/5 hover:text-primary text-foreground/70'
                  )}>
                    Categories
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 glass">
                  {PRODUCT_CATEGORIES.filter(c => c.value !== 'all').map(category => (
                    <DropdownMenuItem key={category.value} asChild>
                      <Link to={`/collections?category=${category.value}`} className="cursor-pointer">
                        {category.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* AI-Styled Search Button */}
              <Button 
                variant="ghost" 
                className={cn(
                  'hidden sm:flex items-center gap-2 px-3 h-9 rounded-full',
                  'bg-muted/50 hover:bg-muted border border-transparent',
                  'hover:border-accent/30 transition-all duration-300',
                  'focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent/50'
                )}
                onClick={() => setSearchOpen(true)}
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Search with AI...</span>
                <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>

              {/* Mobile Search Icon */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="sm:hidden hover:bg-primary/5"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/5">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass">
                  {user ? (
                    <>
                      <DropdownMenuItem className="text-sm text-muted-foreground">
                        {user.email}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/order-tracking" className="cursor-pointer">My Orders</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/sign-in" className="cursor-pointer">Sign In</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/sign-up" className="cursor-pointer">Create Account</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Cart with Premium Animation */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  'relative hover:bg-primary/5 transition-all duration-300',
                  cartBounce && 'animate-cart-bounce'
                )}
                onClick={openCart}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className={cn(
                    'absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center',
                    'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground',
                    'shadow-lg shadow-accent/30',
                    cartBounce && 'animate-pulse-ring'
                  )}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>

              {/* Mobile Menu Toggle */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden hover:bg-primary/5">
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 glass">
                  <div className="flex flex-col gap-6 py-6">
                    <Logo size="lg" />
                    
                    {/* Mobile Search */}
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-muted-foreground border-accent/20 hover:border-accent/40"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setSearchOpen(true);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-accent" />
                      Search with AI...
                    </Button>
                    
                    {/* Mobile Nav Links */}
                    <nav className="flex flex-col gap-2">
                      {navLinks.map(link => (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'text-lg font-medium py-3 px-4 rounded-lg transition-all',
                            'hover:bg-primary/5',
                            isActive(link.href) 
                              ? 'text-primary bg-primary/5' 
                              : 'text-foreground'
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}

                      {/* AI Picks Mobile */}
                      <Link
                        to="/collections?tag=ai-pick"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-lg font-medium py-3 px-4 rounded-lg text-accent hover:bg-accent/10 transition-all"
                      >
                        <Bot className="w-5 h-5" />
                        AI Picks
                        <span className="ml-auto flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-accent opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                        </span>
                      </Link>
                    </nav>

                    {/* Divider */}
                    <div className="h-px bg-border" />

                    {/* Mobile Categories */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">
                        Categories
                      </span>
                      {PRODUCT_CATEGORIES.filter(c => c.value !== 'all').slice(0, 6).map(category => (
                        <Link
                          key={category.value}
                          to={`/collections?category=${category.value}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-sm py-2 px-4 text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        >
                          {category.label}
                        </Link>
                      ))}
                    </div>

                    {/* Mobile Actions */}
                    <div className="mt-auto flex flex-col gap-3 px-4">
                      {isAdmin && (
                        <Button asChild variant="outline" className="w-full">
                          <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                            Admin Dashboard
                          </Link>
                        </Button>
                      )}
                      <Button asChild className="w-full btn-glow bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link to="/collections" onClick={() => setIsMobileMenuOpen(false)}>
                          Shop Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

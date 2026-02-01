import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const { products, isLoading } = useProducts({ search: query, limit: 8 });

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ep-recent-searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const handleSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    // Save to recent searches
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('ep-recent-searches', JSON.stringify(updated));
    
    // Navigate to collections with search
    navigate(`/collections?search=${encodeURIComponent(searchTerm)}`);
    onOpenChange(false);
  }, [navigate, onOpenChange, recentSearches]);

  const handleProductClick = (handle: string) => {
    navigate(`/product/${handle}`);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSearch(query);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('ep-recent-searches');
  };

  const trendingSearches = ['Smart Tech', 'Kitchen Gadgets', 'Fitness', 'Home Organization'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products..."
            className="flex-1 border-0 bg-transparent text-lg placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuery('')}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length > 0 ? (
            // Search Results
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SearchResultSkeleton key={i} />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="space-y-1">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.handle)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {product.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No products found for "{query}"</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Suggestions
            <div className="p-4 space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Recent Searches
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        className="px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-lg text-sm transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Trending Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent-foreground rounded-lg text-sm transition-colors border border-accent/20"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">↵</kbd>
              to search
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">esc</kbd>
              to close
            </span>
          </div>
          <span>Powered by AI</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl">
      <div className="w-14 h-14 rounded-lg skeleton-gold" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 skeleton-gold rounded-full" />
        <div className="h-3 w-20 skeleton-gold rounded-full" />
      </div>
    </div>
  );
}

// Hook to open search with keyboard shortcut
export function useSearchModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}

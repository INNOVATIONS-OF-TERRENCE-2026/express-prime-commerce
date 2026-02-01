import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutList, 
  ChevronDown,
  X
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { PRODUCT_CATEGORIES, SORT_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function CollectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 200]);

  const category = searchParams.get('category') || 'all';
  const tag = searchParams.get('tag') || '';
  const sortBy = searchParams.get('sort') || 'trending';
  const search = searchParams.get('search') || '';

  const { products, isLoading } = useProducts({
    category: category !== 'all' ? category : undefined,
    tag: tag || undefined,
    search: search || undefined,
    sortBy,
  });

  // Filter by price range
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.price >= priceRange[0] && p.price <= priceRange[1]
    );
  }, [products, priceRange]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPriceRange([0, 200]);
  };

  const hasActiveFilters = Boolean(category !== 'all' || tag || search || priceRange[0] > 0 || priceRange[1] < 200);

  // Get page title based on filters
  const pageTitle = useMemo(() => {
    if (tag) {
      const tagTitles: Record<string, string> = {
        'trending': 'Trending Now',
        'bestseller': 'Best Sellers',
        'new': 'New Arrivals',
        'smart-tech': 'Smart Tech',
        'ai-pick': 'AI Recommended',
      };
      return tagTitles[tag] || 'Shop All';
    }
    if (category && category !== 'all') {
      const cat = PRODUCT_CATEGORIES.find(c => c.value === category);
      return cat?.label || 'Shop All';
    }
    return 'Shop All Products';
  }, [tag, category]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">{pageTitle}</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} products found
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              category={category}
              priceRange={priceRange}
              onCategoryChange={(value) => updateParam('category', value)}
              onPriceChange={setPriceRange}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                      {hasActiveFilters && (
                        <Badge className="ml-2 bg-primary text-white">!</Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar
                        category={category}
                        priceRange={priceRange}
                        onCategoryChange={(value) => updateParam('category', value)}
                        onPriceChange={setPriceRange}
                        onClearFilters={clearFilters}
                        hasActiveFilters={hasActiveFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {tag && (
                      <Badge variant="secondary" className="gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => updateParam('tag', '')}
                        />
                      </Badge>
                    )}
                    {category !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {PRODUCT_CATEGORIES.find(c => c.value === category)?.label}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => updateParam('category', 'all')}
                        />
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={clearFilters}
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <Select value={sortBy} onValueChange={(value) => updateParam('sort', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="hidden md:flex items-center border rounded-md">
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'ghost'} 
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <ProductGrid 
              products={filteredProducts} 
              isLoading={isLoading}
              columns={viewMode === 'list' ? 2 : 4}
            />

            {/* Load More / Pagination */}
            {filteredProducts.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg">
                  Load More Products
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Filter Sidebar Component
interface FilterSidebarProps {
  category: string;
  priceRange: number[];
  onCategoryChange: (value: string) => void;
  onPriceChange: (value: number[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterSidebar({
  category,
  priceRange,
  onCategoryChange,
  onPriceChange,
  onClearFilters,
  hasActiveFilters,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-destructive"
          onClick={onClearFilters}
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}

      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {PRODUCT_CATEGORIES.map(cat => (
            <label 
              key={cat.value}
              className={cn(
                "flex items-center gap-2 text-sm cursor-pointer py-1 px-2 rounded hover:bg-muted transition-colors",
                category === cat.value && "bg-muted font-medium"
              )}
            >
              <Checkbox 
                checked={category === cat.value}
                onCheckedChange={() => onCategoryChange(cat.value)}
              />
              {cat.label}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={onPriceChange}
            max={200}
            step={5}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-sm">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}+</span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div>
        <h3 className="font-semibold mb-3">Quick Filters</h3>
        <div className="space-y-2">
          {[
            { value: 'trending', label: '🔥 Trending' },
            { value: 'bestseller', label: '⭐ Best Sellers' },
            { value: 'new', label: '✨ New Arrivals' },
            { value: 'ai-pick', label: '🤖 AI Picks' },
          ].map(filter => (
            <Link
              key={filter.value}
              to={`/collections?tag=${filter.value}`}
              className="block text-sm py-1 px-2 rounded hover:bg-muted transition-colors"
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

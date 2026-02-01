import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye,
  Pause,
  Play,
  Trash2,
  Edit,
  RefreshCcw
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';

type ProductStatus = 'active' | 'paused' | 'killed' | 'draft';

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const statusFilter = searchParams.get('status') || 'all';

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products', statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('updated_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'active' | 'paused' | 'killed' | 'draft');
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,handle.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Update product status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductStatus }) => {
      const { error } = await supabase
        .from('products')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product status updated');
    },
    onError: (error) => {
      toast.error('Failed to update product: ' + error.message);
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete product: ' + error.message);
    },
  });

  const statusColors: Record<ProductStatus, { bg: string; text: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700' },
    paused: { bg: 'bg-amber-100', text: 'text-amber-700' },
    killed: { bg: 'bg-red-100', text: 'text-red-700' },
    draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const getMarginColor = (margin: number | null) => {
    if (!margin) return 'text-muted-foreground';
    if (margin >= 30) return 'text-green-600';
    if (margin >= 20) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <AdminLayout 
      title="Products" 
      description="Manage your product catalog and inventory"
    >
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value === 'all') {
                params.delete('status');
              } else {
                params.set('status', value);
              }
              setSearchParams(params);
            }}
          >
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="killed">Killed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/bulk-import">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Sync Products
            </Link>
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <div className="h-12 skeleton-gold rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No products found</p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium line-clamp-1">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{product.handle}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        statusColors[product.status as ProductStatus]?.bg,
                        statusColors[product.status as ProductStatus]?.text,
                        'capitalize'
                      )}
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${product.price?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${product.cost?.toFixed(2) || '-'}
                  </TableCell>
                  <TableCell className={cn('text-right font-medium', getMarginColor(product.margin_percent))}>
                    {product.margin_percent ? `${product.margin_percent.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {product.product_type || '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/product/${product.handle || product.id}`} target="_blank">
                            <Eye className="w-4 h-4 mr-2" />
                            View in Store
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {product.status === 'active' ? (
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ id: product.id, status: 'paused' })}
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Pause Product
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ id: product.id, status: 'active' })}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Activate Product
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this product?')) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {products.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {products.length} products
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

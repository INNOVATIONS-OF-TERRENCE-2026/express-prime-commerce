import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Truck,
  RefreshCcw,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const statusFilter = searchParams.get('status') || 'all';

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded');
      }

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const statusConfig: Record<OrderStatus, { color: string; bg: string; icon: any }> = {
    pending: { color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
    paid: { color: 'text-green-700', bg: 'bg-green-100', icon: DollarSign },
    processing: { color: 'text-blue-700', bg: 'bg-blue-100', icon: RefreshCcw },
    shipped: { color: 'text-purple-700', bg: 'bg-purple-100', icon: Truck },
    delivered: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle },
    cancelled: { color: 'text-gray-700', bg: 'bg-gray-100', icon: XCircle },
    refunded: { color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  };

  // Stats
  const stats = {
    total: orders.length,
    revenue: orders.reduce((sum, o) => sum + (o.total_price || 0), 0),
    pending: orders.filter(o => o.status === 'pending').length,
    fulfilled: orders.filter(o => o.status === 'fulfilled').length,
  };

  return (
    <AdminLayout 
      title="Orders" 
      description="Manage customer orders and fulfillment"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Fulfilled</p>
          <p className="text-2xl font-bold text-purple-600">{stats.fulfilled}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Sync from Shopify
        </Button>
      </div>

      {/* Orders Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-12 skeleton-gold rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No orders found</p>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const config = statusConfig[order.status as OrderStatus] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono font-medium">
                          #{order.order_number || order.id.slice(0, 8)}
                        </p>
                        {order.shopify_order_id && (
                          <p className="text-xs text-muted-foreground">
                            Shopify: {order.shopify_order_id}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customer_email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(config.bg, config.color, 'capitalize gap-1')}>
                        <StatusIcon className="w-3 h-3" />
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${order.total_price?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Order #{order.order_number || order.id.slice(0, 8)}
                            </DialogTitle>
                            <DialogDescription>
                              {format(new Date(order.created_at), 'MMMM d, yyyy h:mm a')}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                              <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge className={cn(config.bg, config.color, 'capitalize gap-1 mt-1')}>
                                  <StatusIcon className="w-3 h-3" />
                                  {order.status}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">${order.total_price?.toFixed(2)}</p>
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div>
                              <h4 className="font-semibold mb-2">Customer</h4>
                              <p>{order.customer_email}</p>
                              {order.shipping_address && typeof order.shipping_address === 'object' && (
                                <div className="text-sm text-muted-foreground mt-2">
                                  <p>{(order.shipping_address as any).address1}</p>
                                  <p>
                                    {(order.shipping_address as any).city}, {(order.shipping_address as any).province} {(order.shipping_address as any).zip}
                                  </p>
                                  <p>{(order.shipping_address as any).country}</p>
                                </div>
                              )}
                            </div>

                            {/* Line Items */}
                            {order.line_items && Array.isArray(order.line_items) && (
                              <div>
                                <h4 className="font-semibold mb-2">Items</h4>
                                <div className="border rounded-lg divide-y">
                                  {(order.line_items as any[]).map((item: any, i: number) => (
                                    <div key={i} className="p-3 flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Qty: {item.quantity}
                                        </p>
                                      </div>
                                      <p className="font-medium">${item.price?.toFixed(2)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t">
                              <Button variant="outline" className="flex-1">
                                <Truck className="w-4 h-4 mr-2" />
                                Mark as Shipped
                              </Button>
                              <Button variant="outline">
                                Refund
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {orders.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {orders.length} orders
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

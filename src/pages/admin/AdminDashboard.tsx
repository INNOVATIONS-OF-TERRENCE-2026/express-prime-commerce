import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  RefreshCcw,
  Upload,
  Settings
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [productsRes, ordersRes, decisionsRes] = await Promise.all([
        supabase.from('products').select('id, status, price', { count: 'exact' }),
        supabase.from('orders').select('id, total_price, status, created_at', { count: 'exact' }),
        supabase.from('ai_decisions').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const recentDecisions = decisionsRes.data || [];

      const activeProducts = products.filter(p => p.status === 'active').length;
      const pausedProducts = products.filter(p => p.status === 'paused').length;
      
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
      const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      }).length;

      return {
        totalRevenue,
        totalOrders: orders.length,
        todayOrders,
        activeProducts,
        pausedProducts,
        totalProducts: products.length,
        recentDecisions,
      };
    },
  });

  // Fetch recent orders
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Fetch products needing attention
  const { data: attentionProducts = [] } = useQuery({
    queryKey: ['attention-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('status', ['paused', 'killed'])
        .order('updated_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: `${stats?.todayOrders || 0} today`,
      trend: 'neutral',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Active Products',
      value: stats?.activeProducts || 0,
      change: `${stats?.pausedProducts || 0} paused`,
      trend: 'neutral',
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '+0.5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ];

  return (
    <AdminLayout 
      title="Dashboard" 
      description="Overview of your Express Prime store performance"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className={cn(
                    "flex items-center gap-1 text-sm mt-1",
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 
                    'text-muted-foreground'
                  )}>
                    {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                    {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', stat.bg)}>
                  <stat.icon className={cn('w-6 h-6', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">#{order.order_number || order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total_price?.toFixed(2)}</p>
                      <Badge variant={
                        order.status === 'paid' ? 'default' :
                        order.status === 'fulfilled' ? 'secondary' :
                        order.status === 'cancelled' ? 'destructive' : 'outline'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Decisions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                AI Decisions
              </CardTitle>
              <CardDescription>Recent automated decisions</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/ai-decisions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentDecisions?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No AI decisions yet</p>
            ) : (
              <div className="space-y-4">
                {stats?.recentDecisions?.map((decision) => (
                  <div key={decision.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      decision.decision_type === 'pause' ? 'bg-amber-100' :
                      decision.decision_type === 'kill' ? 'bg-red-100' :
                      decision.decision_type === 'reprice' ? 'bg-blue-100' : 'bg-green-100'
                    )}>
                      {decision.decision_type === 'pause' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {decision.decision_type === 'kill' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                      {decision.decision_type === 'reprice' && <RefreshCcw className="w-4 h-4 text-blue-600" />}
                      {decision.decision_type === 'activate' && <Package className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize">{decision.decision_type}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{decision.reason}</p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      {(decision.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Needing Attention */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Needs Attention
              </CardTitle>
              <CardDescription>Products requiring review</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/products?status=paused">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {attentionProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">All products are healthy! 🎉</p>
            ) : (
              <div className="space-y-3">
                {attentionProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
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
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{product.title}</p>
                        <p className="text-xs text-muted-foreground">${product.price?.toFixed(2)}</p>
                      </div>
                    </div>
                    <Badge variant={product.status === 'paused' ? 'outline' : 'destructive'}>
                      {product.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/admin/bulk-import">
                <Upload className="w-5 h-5" />
                <span className="text-sm">Bulk Import</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/admin/products">
                <Package className="w-5 h-5" />
                <span className="text-sm">Manage Products</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/admin/ai-decisions">
                <Bot className="w-5 h-5" />
                <span className="text-sm">AI Decisions</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/admin/settings">
                <Settings className="w-5 h-5" />
                <span className="text-sm">Settings</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

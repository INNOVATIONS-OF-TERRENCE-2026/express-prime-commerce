import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OrderStatus {
  status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  orderNumber: string;
  email: string;
  estimatedDelivery: string;
  trackingNumber?: string;
  carrier?: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  timeline: Array<{ status: string; date: string; completed: boolean }>;
}

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call - in production this would hit Supabase/Shopify
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Demo order for testing
    if (orderNumber.toLowerCase() === 'ep-12345') {
      setOrder({
        status: 'shipped',
        orderNumber: 'EP-12345',
        email: email,
        estimatedDelivery: 'February 3-5, 2026',
        trackingNumber: '1Z999AA10123456784',
        carrier: 'UPS',
        items: [
          { title: 'Digital Kitchen Scale', quantity: 1, price: 19.95 },
          { title: 'Yoga Mat Extra Thick', quantity: 1, price: 29.95 },
        ],
        timeline: [
          { status: 'Order Placed', date: 'Jan 28, 2026', completed: true },
          { status: 'Processing', date: 'Jan 29, 2026', completed: true },
          { status: 'Shipped', date: 'Jan 30, 2026', completed: true },
          { status: 'Out for Delivery', date: 'Pending', completed: false },
          { status: 'Delivered', date: 'Pending', completed: false },
        ],
      });
    } else {
      setError('Order not found. Please check your order number and email address.');
      setOrder(null);
    }

    setIsLoading(false);
  };

  const statusIcons = {
    processing: Clock,
    shipped: Truck,
    out_for_delivery: MapPin,
    delivered: CheckCircle,
  };

  const StatusIcon = order ? statusIcons[order.status] : Package;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-muted-foreground mb-8">
          Enter your order number and email to track your shipment.
        </p>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    placeholder="e.g., EP-12345"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full md:w-auto btn-glow"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Track Order
                  </>
                )}
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status */}
        {order && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-2xl">Order {order.orderNumber}</CardTitle>
                  <CardDescription>Ordered for {order.email}</CardDescription>
                </div>
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  order.status === 'delivered' ? "bg-green-100" : "bg-blue-100"
                )}>
                  <StatusIcon className={cn(
                    "w-8 h-8",
                    order.status === 'delivered' ? "text-green-600" : "text-blue-600"
                  )} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{order.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                    <p className="font-semibold">{order.estimatedDelivery}</p>
                  </div>
                  {order.trackingNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tracking ({order.carrier})</p>
                      <p className="font-semibold font-mono text-sm">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Shipment Progress</h3>
                  <div className="relative">
                    {order.timeline.map((step, index) => (
                      <div key={step.status} className="flex items-start gap-4 pb-6 last:pb-0">
                        {/* Line */}
                        {index < order.timeline.length - 1 && (
                          <div className={cn(
                            "absolute left-[11px] top-6 w-0.5 h-[calc(100%-24px)]",
                            step.completed ? "bg-primary" : "bg-muted"
                          )} style={{ transform: `translateY(${index * 52}px)` }} />
                        )}
                        
                        {/* Dot */}
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10",
                          step.completed 
                            ? "bg-primary text-white" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {step.completed ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-current" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <p className={cn(
                            "font-medium",
                            !step.completed && "text-muted-foreground"
                          )}>
                            {step.status}
                          </p>
                          <p className="text-sm text-muted-foreground">{step.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {order.items.map((item, index) => (
                    <div key={index} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">${item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Need help with your order?{' '}
                  <a href="/support" className="text-primary hover:underline">
                    Contact our support team
                  </a>{' '}
                  and we'll be happy to assist you.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Demo Hint */}
        <p className="text-xs text-center text-muted-foreground mt-8">
          Demo: Try order number "EP-12345" with any email to see tracking
        </p>
      </div>
    </Layout>
  );
}

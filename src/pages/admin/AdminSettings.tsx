import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Shield, 
  DollarSign, 
  AlertTriangle,
  Clock,
  Save,
  Store,
  Key,
  RefreshCcw
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PROFIT_PROTECTION } from '@/lib/constants';

interface GlobalSettings {
  minMarginPercent: number;
  maxRefundRatePercent: number;
  noSalesKillWindowDays: number;
  noSalesPauseWindowDays: number;
  rateLimitSafeMode: boolean;
  autoApplyDecisions: boolean;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<GlobalSettings>({
    minMarginPercent: PROFIT_PROTECTION.minMarginPercent,
    maxRefundRatePercent: PROFIT_PROTECTION.maxRefundRatePercent,
    noSalesKillWindowDays: PROFIT_PROTECTION.noSalesKillWindowDays,
    noSalesPauseWindowDays: PROFIT_PROTECTION.noSalesPauseWindowDays,
    rateLimitSafeMode: true,
    autoApplyDecisions: false,
  });

  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');

  // Fetch existing settings
  const { isLoading } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('global_settings')
        .select('*');
      
      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(s => {
          settingsMap[s.key] = s.value;
        });
        
        setSettings(prev => ({
          ...prev,
          ...settingsMap.profit_protection,
        }));
      }
      
      return data;
    },
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('global_settings')
        .upsert({
          key: 'profit_protection',
          value: JSON.parse(JSON.stringify(settings)),
          description: 'Profit protection thresholds and rules',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  // Shopify connection mutation
  const connectShopifyMutation = useMutation({
    mutationFn: async () => {
      // In production, this would trigger the OAuth flow
      // For now, we'll just save the domain
      const { error } = await supabase
        .from('shopify_installations')
        .upsert({
          shop_domain: shopifyDomain,
          is_active: true,
          installed_at: new Date().toISOString(),
        }, { onConflict: 'shop_domain' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shopify store connected');
    },
    onError: (error) => {
      toast.error('Failed to connect Shopify: ' + error.message);
    },
  });

  return (
    <AdminLayout 
      title="Settings" 
      description="Configure global rules and integrations"
    >
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profit Protection Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Profit Protection Rules
            </CardTitle>
            <CardDescription>
              Configure automated rules for margin and refund protection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Min Margin Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Minimum Margin Threshold
                </Label>
                <span className="font-mono font-bold">{settings.minMarginPercent}%</span>
              </div>
              <Slider
                value={[settings.minMarginPercent]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, minMarginPercent: value }))}
                min={0}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Products below this margin will be flagged for review
              </p>
            </div>

            <Separator />

            {/* Max Refund Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Maximum Refund Rate
                </Label>
                <span className="font-mono font-bold">{settings.maxRefundRatePercent}%</span>
              </div>
              <Slider
                value={[settings.maxRefundRatePercent]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, maxRefundRatePercent: value }))}
                min={0}
                max={30}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Products exceeding this refund rate will be paused
              </p>
            </div>

            <Separator />

            {/* No Sales Windows */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pause Window (days)
                </Label>
                <Input
                  type="number"
                  value={settings.noSalesPauseWindowDays}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    noSalesPauseWindowDays: parseInt(e.target.value) || 7 
                  }))}
                  min={1}
                  max={30}
                />
                <p className="text-xs text-muted-foreground">
                  Days without sales before pausing
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Kill Window (days)
                </Label>
                <Input
                  type="number"
                  value={settings.noSalesKillWindowDays}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    noSalesKillWindowDays: parseInt(e.target.value) || 14 
                  }))}
                  min={1}
                  max={60}
                />
                <p className="text-xs text-muted-foreground">
                  Days without sales before killing
                </p>
              </div>
            </div>

            <Separator />

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Rate Limit Safe Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Add delays between API calls to avoid rate limits
                  </p>
                </div>
                <Switch
                  checked={settings.rateLimitSafeMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    rateLimitSafeMode: checked 
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Apply Decisions</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically apply AI decisions without review
                  </p>
                </div>
                <Switch
                  checked={settings.autoApplyDecisions}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    autoApplyDecisions: checked 
                  }))}
                />
              </div>
            </div>

            <Button 
              className="w-full btn-glow"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Shopify Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-green-600" />
              Shopify Integration
            </CardTitle>
            <CardDescription>
              Connect your Shopify store for product sync and orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopifyDomain">Store Domain</Label>
              <Input
                id="shopifyDomain"
                placeholder="your-store.myshopify.com"
                value={shopifyDomain}
                onChange={(e) => setShopifyDomain(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopifyToken" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Storefront Access Token
              </Label>
              <Input
                id="shopifyToken"
                type="password"
                placeholder="shpat_xxxxxxxxxxxx"
                value={shopifyToken}
                onChange={(e) => setShopifyToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Create a Storefront API access token in your Shopify admin
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                className="w-full"
                onClick={() => connectShopifyMutation.mutate()}
                disabled={!shopifyDomain || connectShopifyMutation.isPending}
              >
                <Store className="w-4 h-4 mr-2" />
                Connect Shopify Store
              </Button>
              
              <Button variant="outline" className="w-full">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Sync Products from Shopify
              </Button>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg text-sm">
              <p className="font-medium text-amber-800 mb-1">⚠️ Security Note</p>
              <p className="text-amber-700">
                Admin API tokens are stored securely and only used via server-side Edge Functions. 
                Never expose Admin API tokens in client-side code.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Status */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Status</CardTitle>
            <CardDescription>
              Active Shopify webhooks for real-time sync
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { topic: 'orders/create', status: 'active' },
                { topic: 'orders/updated', status: 'active' },
                { topic: 'refunds/create', status: 'pending' },
                { topic: 'products/update', status: 'active' },
              ].map((webhook) => (
                <div 
                  key={webhook.topic}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <code className="text-sm">{webhook.topic}</code>
                  <span className={`text-xs font-medium ${
                    webhook.status === 'active' ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {webhook.status}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Register Webhooks
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions - proceed with caution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium">Reset All AI Decisions</p>
                <p className="text-xs text-muted-foreground">Clear all AI decision history</p>
              </div>
              <Button variant="destructive" size="sm">Reset</Button>
            </div>
            <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium">Disconnect Shopify</p>
                <p className="text-xs text-muted-foreground">Remove Shopify integration</p>
              </div>
              <Button variant="destructive" size="sm">Disconnect</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

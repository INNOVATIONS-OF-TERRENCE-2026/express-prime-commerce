import { useQuery } from '@tanstack/react-query';
import { 
  Bot, 
  AlertTriangle, 
  RefreshCcw, 
  Pause, 
  XCircle,
  CheckCircle,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AdminAIDecisions() {
  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ['ai-decisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_decisions')
        .select(`
          *,
          products:product_id (
            id,
            title,
            handle,
            image_url,
            price
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const decisionIcons: Record<string, any> = {
    pause: Pause,
    kill: XCircle,
    reprice: DollarSign,
    flag: AlertTriangle,
    activate: CheckCircle,
  };

  const decisionColors: Record<string, { bg: string; text: string; icon: string }> = {
    pause: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
    kill: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
    reprice: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
    flag: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
    activate: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
  };

  // Stats
  const stats = {
    total: decisions.length,
    paused: decisions.filter(d => d.decision_type === 'pause').length,
    killed: decisions.filter(d => d.decision_type === 'kill').length,
    repriced: decisions.filter(d => d.decision_type === 'reprice').length,
    applied: decisions.filter(d => d.was_applied).length,
  };

  return (
    <AdminLayout 
      title="AI Decisions" 
      description="Review autonomous decisions made by the profit protection system"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Decisions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-amber-600">{stats.paused}</p>
            <p className="text-xs text-muted-foreground">Paused</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-red-600">{stats.killed}</p>
            <p className="text-xs text-muted-foreground">Killed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-blue-600">{stats.repriced}</p>
            <p className="text-xs text-muted-foreground">Repriced</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-green-600">{stats.applied}</p>
            <p className="text-xs text-muted-foreground">Applied</p>
          </CardContent>
        </Card>
      </div>

      {/* Decisions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Decision Log
              </CardTitle>
              <CardDescription>
                Automated decisions based on profit protection rules
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 skeleton-gold rounded-lg" />
              ))}
            </div>
          ) : decisions.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium mb-2">No AI Decisions Yet</p>
              <p className="text-muted-foreground text-sm">
                The profit protection system will log decisions here when it takes action on products.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {decisions.map((decision) => {
                const Icon = decisionIcons[decision.decision_type] || AlertTriangle;
                const colors = decisionColors[decision.decision_type] || decisionColors.flag;
                const product = decision.products as any;
                
                return (
                  <div 
                    key={decision.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      colors.bg
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        colors.bg
                      )}>
                        <Icon className={cn("w-5 h-5", colors.icon)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={cn(colors.bg, colors.text, 'capitalize')}>
                                {decision.decision_type}
                              </Badge>
                              {decision.was_applied && (
                                <Badge variant="outline" className="border-green-600 text-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Applied
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(decision.created_at), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            
                            {product && (
                              <p className="font-medium mt-2">{product.title}</p>
                            )}
                            
                            <p className="text-sm text-muted-foreground mt-1">
                              {decision.reason}
                            </p>
                          </div>

                          {/* Confidence */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-muted-foreground">Confidence</p>
                            <p className={cn(
                              "text-lg font-bold",
                              decision.confidence >= 0.8 ? "text-green-600" :
                              decision.confidence >= 0.5 ? "text-amber-600" : "text-red-600"
                            )}>
                              {(decision.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {/* Value Changes */}
                        {(decision.old_value || decision.new_value) && (
                          <div className="mt-3 pt-3 border-t border-current/10 flex items-center gap-4 text-sm">
                            {decision.old_value && (
                              <span className="text-muted-foreground">
                                Old: <code className="bg-white/50 px-1 rounded">{JSON.stringify(decision.old_value)}</code>
                              </span>
                            )}
                            {decision.new_value && (
                              <span className="text-muted-foreground">
                                New: <code className="bg-white/50 px-1 rounded">{JSON.stringify(decision.new_value)}</code>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        {!decision.was_applied && (
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline">
                              Apply Decision
                            </Button>
                            <Button size="sm" variant="ghost">
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

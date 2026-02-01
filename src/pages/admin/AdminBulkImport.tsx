import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Pause,
  RefreshCcw,
  Download
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportItem {
  sku: string;
  title: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
}

interface ParsedProduct {
  handle: string;
  title: string;
  description: string;
  vendor: string;
  product_type: string;
  tags: string[];
  price: number;
  compare_at_price: number;
  status: 'active' | 'draft';
}

export default function AdminBulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ created: 0, updated: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const parseCSV = (content: string): ParsedProduct[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const products: ParsedProduct[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Handle CSV parsing with quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      if (row['Handle'] && row['Title']) {
        products.push({
          handle: row['Handle'],
          title: row['Title'],
          description: row['Body (HTML)'] || '',
          vendor: row['Vendor'] || 'Express Prime',
          product_type: row['Type'] || '',
          tags: row['Tags'] ? row['Tags'].split(', ').map(t => t.trim()) : [],
          price: parseFloat(row['Variant Price']) || 0,
          compare_at_price: parseFloat(row['Variant Compare At Price']) || 0,
          status: row['Status'] === 'active' ? 'active' : 'draft',
        });
      }
    }
    
    return products;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const products = parseCSV(content);
      setParsedProducts(products);
      setImportItems(products.map(p => ({
        sku: p.handle,
        title: p.title,
        status: 'pending',
      })));
      setProgress(0);
      setStats({ created: 0, updated: 0, failed: 0 });
    };
    reader.readAsText(selectedFile);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runImport = async () => {
    setIsImporting(true);
    setIsPaused(false);
    
    const batchSize = 10;
    const retryDelay = 1000;
    let created = 0;
    let updated = 0;
    let failed = 0;
    
    // Create sync run record
    const { data: syncRun, error: syncError } = await supabase
      .from('sync_runs')
      .insert({
        sync_type: 'bulk_import',
        status: 'processing',
        total_items: parsedProducts.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (syncError) {
      toast.error('Failed to start import: ' + syncError.message);
      setIsImporting(false);
      return;
    }
    
    for (let i = 0; i < parsedProducts.length; i += batchSize) {
      if (isPaused) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!isPaused) {
              clearInterval(checkPause);
              resolve(true);
            }
          }, 500);
        });
      }
      
      const batch = parsedProducts.slice(i, i + batchSize);
      
      for (let j = 0; j < batch.length; j++) {
        const product = batch[j];
        const itemIndex = i + j;
        
        // Update item status to processing
        setImportItems(prev => prev.map((item, idx) => 
          idx === itemIndex ? { ...item, status: 'processing' } : item
        ));
        
        let retries = 0;
        let success = false;
        
        while (retries < 3 && !success) {
          try {
            // Check if product exists
            const { data: existing } = await supabase
              .from('products')
              .select('id')
              .eq('handle', product.handle)
              .single();
            
            if (existing) {
              // Update existing product
              const { error } = await supabase
                .from('products')
                .update({
                  title: product.title,
                  description: product.description,
                  vendor: product.vendor,
                  product_type: product.product_type,
                  tags: product.tags,
                  price: product.price,
                  compare_at_price: product.compare_at_price,
                  status: product.status,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
              
              if (error) throw error;
              updated++;
            } else {
              // Create new product
              const { error } = await supabase
                .from('products')
                .insert({
                  handle: product.handle,
                  title: product.title,
                  description: product.description,
                  vendor: product.vendor,
                  product_type: product.product_type,
                  tags: product.tags,
                  price: product.price,
                  compare_at_price: product.compare_at_price,
                  status: product.status,
                });
              
              if (error) throw error;
              created++;
            }
            
            success = true;
            setImportItems(prev => prev.map((item, idx) => 
              idx === itemIndex ? { ...item, status: 'success' } : item
            ));
            
            // Log success in sync_items
            await supabase.from('sync_items').insert({
              sync_run_id: syncRun.id,
              external_id: product.handle,
              item_type: existing ? 'update' : 'create',
              status: 'completed' as const,
            });
            
          } catch (error: any) {
            retries++;
            if (retries >= 3) {
              failed++;
              setImportItems(prev => prev.map((item, idx) => 
                idx === itemIndex ? { ...item, status: 'failed', error: error.message } : item
              ));
              
              // Log failure
              await supabase.from('sync_items').insert({
                sync_run_id: syncRun.id,
                external_id: product.handle,
                item_type: 'create',
                status: 'failed' as const,
                error_message: error.message,
              });
            } else {
              // Exponential backoff
              await delay(retryDelay * Math.pow(2, retries));
            }
          }
        }
        
        setProgress(((itemIndex + 1) / parsedProducts.length) * 100);
        setStats({ created, updated, failed });
        
        // Small delay between items to avoid rate limiting
        await delay(100);
      }
    }
    
    // Update sync run status
    await supabase
      .from('sync_runs')
      .update({
        status: (failed > 0 ? 'failed' : 'completed') as 'pending' | 'processing' | 'completed' | 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncRun.id);
    
    setIsImporting(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    
    if (failed === 0) {
      toast.success(`Import completed! Created: ${created}, Updated: ${updated}`);
    } else {
      toast.warning(`Import completed with errors. Created: ${created}, Updated: ${updated}, Failed: ${failed}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedProducts([]);
    setImportItems([]);
    setProgress(0);
    setStats({ created: 0, updated: 0, failed: 0 });
    setIsImporting(false);
    setIsPaused(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AdminLayout 
      title="Bulk Import" 
      description="Import products from CSV files"
    >
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Product File
            </CardTitle>
            <CardDescription>
              Upload a CSV file exported from Shopify or in our format
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium mb-1">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supports Shopify product CSV format
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {parsedProducts.length} products found
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Change File
                  </Button>
                </div>

                {/* Progress */}
                {(isImporting || progress > 0) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Import Progress</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.created}</p>
                    <p className="text-xs text-green-700">Created</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.updated}</p>
                    <p className="text-xs text-blue-700">Updated</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                    <p className="text-xs text-red-700">Failed</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!isImporting ? (
                    <Button 
                      className="flex-1 btn-glow" 
                      onClick={runImport}
                      disabled={parsedProducts.length === 0}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run Bulk Import
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsPaused(!isPaused)}
                      >
                        {isPaused ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={handleReset}>
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Log */}
        <Card>
          <CardHeader>
            <CardTitle>Import Log</CardTitle>
            <CardDescription>
              Real-time status of each product import
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Upload a file to see import progress</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {importItems.map((item, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        item.status === 'success' && "bg-green-50 border-green-200",
                        item.status === 'failed' && "bg-red-50 border-red-200",
                        item.status === 'processing' && "bg-blue-50 border-blue-200",
                        item.status === 'pending' && "bg-gray-50 border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                        {item.status === 'failed' && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                        {item.status === 'processing' && <RefreshCcw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />}
                        {item.status === 'pending' && <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                          {item.error && (
                            <p className="text-xs text-red-600 mt-1">{item.error}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn(
                          item.status === 'success' && "border-green-600 text-green-600",
                          item.status === 'failed' && "border-red-600 text-red-600",
                          item.status === 'processing' && "border-blue-600 text-blue-600"
                        )}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ul className="text-muted-foreground space-y-2">
            <li>Upload a Shopify-formatted CSV file with your product data</li>
            <li>Products are imported in batches of 10 to avoid rate limiting</li>
            <li>Existing products (matched by handle) will be updated</li>
            <li>New products will be created with "draft" status by default</li>
            <li>Failed imports will retry up to 3 times with exponential backoff</li>
            <li>You can pause and resume the import at any time</li>
          </ul>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

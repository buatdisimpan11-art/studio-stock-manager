import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Copy, Check, ArrowDown, ArrowUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudios } from '@/hooks/useStudios';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LiveProduct {
  name: string;
  gmv: number;
  clicks: number;
  score: number;
}

interface InventoryProduct {
  id: string;
  name: string;
  affiliate_link: string;
  score: number;
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const [selectedStudio, setSelectedStudio] = useState<string>('');
  const [liveProducts, setLiveProducts] = useState<LiveProduct[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rotationCount, setRotationCount] = useState<number>(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: studios } = useStudios();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudio) return;

    setImportStatus('processing');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setErrorMessage('File CSV harus memiliki header dan minimal 1 baris data');
          setImportStatus('error');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h.includes('nama') || h.includes('name') || h.includes('produk'));
        const gmvIndex = headers.findIndex(h => h.includes('gmv') || h.includes('revenue') || h.includes('penjualan'));
        const clicksIndex = headers.findIndex(h => h.includes('klik') || h.includes('click'));

        if (nameIndex === -1) {
          setErrorMessage('File CSV harus memiliki kolom "Nama Produk"');
          setImportStatus('error');
          return;
        }

        const parsed: LiveProduct[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < 1) continue;

          const name = values[nameIndex]?.trim();
          if (!name) continue;

          const gmv = gmvIndex >= 0 ? parseNumber(values[gmvIndex]) : 0;
          const clicks = clicksIndex >= 0 ? parseInt(values[clicksIndex]) || 0 : 0;
          // Calculate score: GMV * 0.7 + Clicks * 1000 * 0.3
          const score = (gmv * 0.7) + (clicks * 1000 * 0.3);

          parsed.push({ name, gmv, clicks, score });
        }

        // Sort by score ascending (lowest first = worst performers)
        parsed.sort((a, b) => a.score - b.score);
        setLiveProducts(parsed);

        // Fetch inventory products (AVAILABLE status from selected studio)
        await fetchInventoryProducts(selectedStudio);
        
        setImportStatus('ready');
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Gagal membaca file CSV');
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const fetchInventoryProducts = async (studioId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, affiliate_link, score')
      .eq('studio_id', studioId)
      .eq('status', 'AVAILABLE')
      .order('score', { ascending: false });

    if (error) throw error;
    setInventoryProducts(data || []);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const parseNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Link disalin!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const resetState = () => {
    setLiveProducts([]);
    setInventoryProducts([]);
    setSelectedStudio('');
    setImportStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get lowest performers from live products
  const lowestPerformers = liveProducts.slice(0, rotationCount);
  // Get top replacements from inventory
  const topReplacements = inventoryProducts.slice(0, rotationCount);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className={cn(
        "bg-card border-border",
        importStatus === 'ready' ? "max-w-5xl max-h-[90vh] overflow-hidden" : "max-w-lg"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {importStatus === 'ready' ? 'Analisis Performa Harian' : 'Upload Data Performa Live'}
          </DialogTitle>
        </DialogHeader>

        {importStatus !== 'ready' ? (
          <div className="space-y-4">
            {/* Studio Selection */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Pilih Studio
              </label>
              <Select value={selectedStudio} onValueChange={setSelectedStudio}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Pilih studio..." />
                </SelectTrigger>
                <SelectContent>
                  {studios?.map((studio) => (
                    <SelectItem key={studio.id} value={studio.id}>
                      {studio.name} - {studio.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Upload File CSV Performa Live
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={!selectedStudio}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className={`cursor-pointer ${!selectedStudio ? 'opacity-50' : ''}`}>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {selectedStudio ? 'Klik untuk upload atau drag & drop' : 'Pilih studio terlebih dahulu'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: Nama Produk, GMV, Klik
                  </p>
                </label>
              </div>
            </div>

            {/* Processing */}
            {importStatus === 'processing' && (
              <div className="flex items-center gap-2 text-primary text-sm bg-primary/10 p-3 rounded-lg">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Menganalisis data performa...
              </div>
            )}

            {/* Error */}
            {importStatus === 'error' && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">Produk Live</p>
                <p className="text-xl font-bold text-foreground">{liveProducts.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive">Perlu Diganti</p>
                <p className="text-xl font-bold text-destructive">{rotationCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-success">Stok Inventaris</p>
                <p className="text-xl font-bold text-success">{inventoryProducts.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-primary">Total GMV</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(liveProducts.reduce((sum, p) => sum + p.gmv, 0))}
                </p>
              </div>
            </div>

            {/* Rotation Count Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Jumlah rotasi harian:</label>
              <Select value={rotationCount.toString()} onValueChange={(v) => setRotationCount(parseInt(v))}>
                <SelectTrigger className="w-24 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25, 30].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Lowest Performers - To Remove */}
              <div className="rounded-xl border border-destructive/20 overflow-hidden">
                <div className="bg-destructive/10 px-4 py-2 flex items-center gap-2 sticky top-0">
                  <ArrowDown className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">
                    {rotationCount} Performa Terendah (Hapus dari Live)
                  </span>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {lowestPerformers.map((product, index) => (
                    <div key={index} className="p-3 hover:bg-secondary/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {index + 1}. {product.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              GMV: {formatCurrency(product.gmv)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Klik: {product.clicks}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded shrink-0">
                          {Math.round(product.score).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Replacements from Inventory - To Add */}
              <div className="rounded-xl border border-success/20 overflow-hidden">
                <div className="bg-success/10 px-4 py-2 flex items-center gap-2 sticky top-0">
                  <ArrowUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-semibold text-success">
                    {topReplacements.length} Produk Pengganti (dari Inventaris)
                  </span>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {topReplacements.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Tidak ada produk AVAILABLE di inventaris studio ini
                    </div>
                  ) : (
                    topReplacements.map((product, index) => (
                      <div key={product.id} className="p-3 hover:bg-secondary/30">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {index + 1}. {product.name}
                            </p>
                            <p className="text-xs text-success mt-0.5">
                              Skor: {Math.round(product.score).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => copyToClipboard(product.affiliate_link, product.id)}
                          >
                            {copiedId === product.id ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        <p 
                          className="text-xs text-primary truncate mt-1 hover:underline cursor-pointer"
                          onClick={() => copyToClipboard(product.affiliate_link, product.id)}
                        >
                          {product.affiliate_link}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Full Live Products Table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-secondary/50 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Semua Produk Live ({liveProducts.length})
                </span>
                <span className="text-xs text-muted-foreground">
                  Diurutkan dari performa terendah
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/30 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Nama Produk</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">GMV</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Klik</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {liveProducts.map((product, index) => (
                      <tr 
                        key={index} 
                        className={cn(
                          "hover:bg-secondary/30",
                          index < rotationCount && "bg-destructive/5"
                        )}
                      >
                        <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-2 truncate max-w-[200px]">{product.name}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(product.gmv)}</td>
                        <td className="px-3 py-2 text-right">{product.clicks}</td>
                        <td className={cn(
                          "px-3 py-2 text-right font-medium",
                          index < rotationCount ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {Math.round(product.score).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetState}
              >
                Upload Ulang
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

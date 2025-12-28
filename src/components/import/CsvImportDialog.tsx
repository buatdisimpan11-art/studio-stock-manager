import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, AlertTriangle, Copy, Check, ArrowDown, ArrowUp } from 'lucide-react';
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

interface ParsedPerformance {
  name: string;
  gmv: number;
  clicks: number;
}

interface PerformanceProduct {
  csvName: string;
  matchedId: string | null;
  matchedName: string | null;
  gmv: number;
  clicks: number;
  score: number;
}

interface ReplacementProduct {
  id: string;
  name: string;
  affiliate_link: string;
  score: number;
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const [selectedStudio, setSelectedStudio] = useState<string>('');
  const [performanceData, setPerformanceData] = useState<PerformanceProduct[]>([]);
  const [replacements, setReplacements] = useState<ReplacementProduct[]>([]);
  const [notFoundProducts, setNotFoundProducts] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'matching' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rotationCount, setRotationCount] = useState<number>(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: studios } = useStudios();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudio) return;

    setImportStatus('matching');
    
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

        const performances: ParsedPerformance[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < 1) continue;

          const name = values[nameIndex]?.trim();
          if (!name) continue;

          performances.push({
            name,
            gmv: gmvIndex >= 0 ? parseNumber(values[gmvIndex]) : 0,
            clicks: clicksIndex >= 0 ? parseInt(values[clicksIndex]) || 0 : 0,
          });
        }

        await processPerformanceData(performances, selectedStudio);
        setImportStatus('ready');
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Gagal membaca file CSV');
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const processPerformanceData = async (performances: ParsedPerformance[], studioId: string) => {
    // Get all LIVE products from the selected studio
    const { data: studioProducts, error } = await supabase
      .from('products')
      .select('id, name, affiliate_link, score')
      .eq('studio_id', studioId)
      .eq('status', 'LIVE');

    if (error) throw error;

    // Get AVAILABLE products as replacements
    const { data: availableProducts, error: availError } = await supabase
      .from('products')
      .select('id, name, affiliate_link, score')
      .eq('studio_id', studioId)
      .eq('status', 'AVAILABLE')
      .order('score', { ascending: false });

    if (availError) throw availError;

    const matched: PerformanceProduct[] = [];
    const notFound: string[] = [];

    for (const perf of performances) {
      // Find matching product by name (case-insensitive partial match)
      const matchedProduct = studioProducts?.find(p => 
        p.name.toLowerCase().includes(perf.name.toLowerCase()) ||
        perf.name.toLowerCase().includes(p.name.toLowerCase())
      );

      // Calculate score: GMV * 0.7 + Clicks * 1000 * 0.3
      const score = (perf.gmv * 0.7) + (perf.clicks * 1000 * 0.3);

      if (matchedProduct) {
        matched.push({
          csvName: perf.name,
          matchedId: matchedProduct.id,
          matchedName: matchedProduct.name,
          gmv: perf.gmv,
          clicks: perf.clicks,
          score,
        });
      } else {
        notFound.push(perf.name);
        matched.push({
          csvName: perf.name,
          matchedId: null,
          matchedName: null,
          gmv: perf.gmv,
          clicks: perf.clicks,
          score,
        });
      }
    }

    // Sort by score ascending (lowest first = worst performers)
    matched.sort((a, b) => a.score - b.score);
    
    setPerformanceData(matched);
    setNotFoundProducts(notFound);
    setReplacements(availableProducts || []);
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
    setPerformanceData([]);
    setReplacements([]);
    setNotFoundProducts([]);
    setSelectedStudio('');
    setImportStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const lowestPerformers = performanceData.slice(0, rotationCount);
  const topReplacements = replacements.slice(0, rotationCount);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className={cn(
        "bg-card border-border",
        importStatus === 'ready' ? "max-w-4xl max-h-[90vh] overflow-hidden" : "max-w-lg"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {importStatus === 'ready' ? 'Analisis Performa Harian' : 'Upload Data Performa CSV'}
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
                Upload File CSV Performa
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

            {/* Matching */}
            {importStatus === 'matching' && (
              <div className="flex items-center gap-2 text-primary text-sm bg-primary/10 p-3 rounded-lg">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Menganalisis data performa...
              </div>
            )}

            {/* Status Messages */}
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
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">Total Produk</p>
                <p className="text-xl font-bold text-foreground">{performanceData.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive">Perlu Diganti</p>
                <p className="text-xl font-bold text-destructive">{lowestPerformers.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-success">Pengganti Tersedia</p>
                <p className="text-xl font-bold text-success">{replacements.length}</p>
              </div>
            </div>

            {/* Rotation Count Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Jumlah rotasi:</label>
              <Select value={rotationCount.toString()} onValueChange={(v) => setRotationCount(parseInt(v))}>
                <SelectTrigger className="w-24 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 10, 15, 20].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Not Found Warning */}
            {notFoundProducts.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-warning text-sm font-medium mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  {notFoundProducts.length} produk tidak cocok dengan database
                </div>
                <p className="text-xs text-muted-foreground">
                  Produk ini tetap ditampilkan tapi tidak bisa di-track untuk rotasi
                </p>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Lowest Performers - To Remove */}
              <div className="rounded-xl border border-destructive/20 overflow-hidden">
                <div className="bg-destructive/10 px-4 py-2 flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">
                    Performa Terendah (Hapus)
                  </span>
                </div>
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {lowestPerformers.map((product, index) => (
                    <div key={index} className="p-3 hover:bg-secondary/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {index + 1}. {product.matchedName || product.csvName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              GMV: {formatCurrency(product.gmv)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Klik: {product.clicks}
                            </span>
                          </div>
                          <p className="text-xs text-destructive mt-1">
                            Skor: {Math.round(product.score).toLocaleString('id-ID')}
                          </p>
                        </div>
                        {!product.matchedId && (
                          <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">
                            ?
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Replacements - To Add */}
              <div className="rounded-xl border border-success/20 overflow-hidden">
                <div className="bg-success/10 px-4 py-2 flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-semibold text-success">
                    Produk Pengganti (Tambah)
                  </span>
                </div>
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {topReplacements.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Tidak ada produk AVAILABLE di studio ini
                    </div>
                  ) : (
                    topReplacements.map((product, index) => (
                      <div key={product.id} className="p-3 hover:bg-secondary/30">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {index + 1}. {product.name}
                            </p>
                            <p className="text-xs text-success mt-1">
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
                        <p className="text-xs text-primary truncate mt-1 hover:underline cursor-pointer"
                           onClick={() => copyToClipboard(product.affiliate_link, product.id)}>
                          {product.affiliate_link}
                        </p>
                      </div>
                    ))
                  )}
                </div>
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

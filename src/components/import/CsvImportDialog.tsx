import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudios } from '@/hooks/useStudios';
import { useBulkUpdatePerformance } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedPerformance {
  name: string;
  gmv: number;
  clicks: number;
}

interface MatchedProduct {
  id: string;
  name: string;
  affiliate_link: string;
  gmv: number;
  clicks: number;
}

interface MatchResult {
  matched: MatchedProduct[];
  notFound: string[];
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const [selectedStudio, setSelectedStudio] = useState<string>('');
  const [matchedProducts, setMatchedProducts] = useState<MatchedProduct[]>([]);
  const [notFoundProducts, setNotFoundProducts] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'matching' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: studios } = useStudios();
  const bulkUpdate = useBulkUpdatePerformance();

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

        // Match with existing products in the selected studio
        const result = await matchProducts(performances, selectedStudio);
        setMatchedProducts(result.matched);
        setNotFoundProducts(result.notFound);
        setImportStatus('idle');
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Gagal membaca file CSV');
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const matchProducts = async (performances: ParsedPerformance[], studioId: string): Promise<MatchResult> => {
    // Get all products from the selected studio
    const { data: studioProducts, error } = await supabase
      .from('products')
      .select('id, name, affiliate_link')
      .eq('studio_id', studioId);

    if (error) throw error;

    const matched: MatchedProduct[] = [];
    const notFound: string[] = [];

    for (const perf of performances) {
      // Find matching product by name (case-insensitive partial match)
      const matchedProduct = studioProducts?.find(p => 
        p.name.toLowerCase().includes(perf.name.toLowerCase()) ||
        perf.name.toLowerCase().includes(p.name.toLowerCase())
      );

      if (matchedProduct) {
        matched.push({
          id: matchedProduct.id,
          name: matchedProduct.name,
          affiliate_link: matchedProduct.affiliate_link,
          gmv: perf.gmv,
          clicks: perf.clicks,
        });
      } else {
        notFound.push(perf.name);
      }
    }

    return { matched, notFound };
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

  const handleImport = async () => {
    if (matchedProducts.length === 0) return;

    try {
      await bulkUpdate.mutateAsync(
        matchedProducts.map(p => ({
          id: p.id,
          gmv: p.gmv,
          clicks: p.clicks,
        }))
      );
      setImportStatus('success');
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (error) {
      setErrorMessage('Gagal mengupdate produk');
      setImportStatus('error');
    }
  };

  const resetState = () => {
    setMatchedProducts([]);
    setNotFoundProducts([]);
    setSelectedStudio('');
    setImportStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Update Data Performa dari CSV
          </DialogTitle>
        </DialogHeader>

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
              Mencocokkan dengan database...
            </div>
          )}

          {/* Status Messages */}
          {importStatus === 'error' && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          {importStatus === 'success' && (
            <div className="flex items-center gap-2 text-success text-sm bg-success/10 p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Berhasil mengupdate {matchedProducts.length} produk!
            </div>
          )}

          {/* Not Found Warning */}
          {notFoundProducts.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-warning text-sm font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                {notFoundProducts.length} produk tidak ditemukan di database:
              </div>
              <div className="max-h-20 overflow-y-auto">
                {notFoundProducts.slice(0, 5).map((name, index) => (
                  <p key={index} className="text-xs text-muted-foreground truncate">
                    • {name}
                  </p>
                ))}
                {notFoundProducts.length > 5 && (
                  <p className="text-xs text-warning">
                    +{notFoundProducts.length - 5} produk lainnya...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {matchedProducts.length > 0 && importStatus !== 'success' && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">
                Preview: {matchedProducts.length} produk akan diupdate
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {matchedProducts.slice(0, 5).map((product, index) => (
                  <p key={index} className="text-xs text-muted-foreground truncate">
                    {product.name} - GMV: Rp{product.gmv.toLocaleString()}, Klik: {product.clicks}
                  </p>
                ))}
                {matchedProducts.length > 5 && (
                  <p className="text-xs text-primary">
                    +{matchedProducts.length - 5} produk lainnya...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              className="flex-1 bg-gradient-primary"
              disabled={matchedProducts.length === 0 || bulkUpdate.isPending || importStatus === 'matching'}
              onClick={handleImport}
            >
              {bulkUpdate.isPending ? 'Mengupdate...' : `Update ${matchedProducts.length} Produk`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

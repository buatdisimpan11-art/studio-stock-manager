import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudios } from '@/hooks/useStudios';
import { useBulkCreateProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { ProductStatus } from '@/types/database';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedProduct {
  name: string;
  affiliate_link: string;
  original_url: string;
  category?: string;
  gmv?: number;
  clicks?: number;
}

interface ImportResult {
  toImport: ParsedProduct[];
  duplicates: string[];
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const [selectedStudio, setSelectedStudio] = useState<string>('');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: studios } = useStudios();
  const bulkCreate = useBulkCreateProducts();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('validating');
    
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
        const affiliateLinkIndex = headers.findIndex(h => h.includes('affiliate') || h.includes('link affiliate'));
        const originalUrlIndex = headers.findIndex(h => h.includes('original') || h.includes('link original') || h.includes('shopee'));
        const categoryIndex = headers.findIndex(h => h.includes('kategori') || h.includes('category'));
        const gmvIndex = headers.findIndex(h => h.includes('gmv') || h.includes('revenue') || h.includes('penjualan'));
        const clicksIndex = headers.findIndex(h => h.includes('klik') || h.includes('click'));

        // Fallback: if no specific affiliate/original columns, use generic 'link' for affiliate
        let linkIndex = affiliateLinkIndex;
        if (linkIndex === -1) {
          linkIndex = headers.findIndex(h => h.includes('link') || h.includes('url'));
        }

        if (nameIndex === -1 || linkIndex === -1) {
          setErrorMessage('File CSV harus memiliki kolom "Nama Produk" dan "Link Affiliate"');
          setImportStatus('error');
          return;
        }

        const products: ParsedProduct[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < 2) continue;

          const name = values[nameIndex]?.trim();
          const affiliateLink = values[linkIndex]?.trim();
          const originalUrl = originalUrlIndex >= 0 ? values[originalUrlIndex]?.trim() : '';

          if (!name || !affiliateLink) continue;

          products.push({
            name,
            affiliate_link: affiliateLink,
            original_url: originalUrl || affiliateLink, // Fallback to affiliate link if no original
            category: categoryIndex >= 0 ? values[categoryIndex]?.trim() : undefined,
            gmv: gmvIndex >= 0 ? parseNumber(values[gmvIndex]) : 0,
            clicks: clicksIndex >= 0 ? parseInt(values[clicksIndex]) || 0 : 0,
          });
        }

        // Check for duplicates in database
        const result = await checkDuplicates(products);
        setParsedProducts(result.toImport);
        setDuplicates(result.duplicates);
        setImportStatus('idle');
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Gagal membaca file CSV');
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const checkDuplicates = async (products: ParsedProduct[]): Promise<ImportResult> => {
    const originalUrls = products.map(p => p.original_url).filter(Boolean);
    
    if (originalUrls.length === 0) {
      return { toImport: products, duplicates: [] };
    }

    const { data: existing } = await supabase
      .from('products')
      .select('original_url')
      .in('original_url', originalUrls);

    const existingUrls = new Set((existing || []).map(p => p.original_url));
    
    const toImport: ParsedProduct[] = [];
    const duplicates: string[] = [];

    for (const product of products) {
      if (existingUrls.has(product.original_url)) {
        duplicates.push(product.name);
      } else {
        toImport.push(product);
      }
    }

    return { toImport, duplicates };
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
    if (!selectedStudio || parsedProducts.length === 0) return;

    try {
      await bulkCreate.mutateAsync(
        parsedProducts.map(p => ({
          studio_id: selectedStudio,
          name: p.name,
          affiliate_link: p.affiliate_link,
          original_url: p.original_url,
          category: p.category,
          gmv: p.gmv || 0,
          clicks: p.clicks || 0,
          status: 'AVAILABLE' as ProductStatus,
        }))
      );
      setImportStatus('success');
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (error) {
      setErrorMessage('Gagal mengimport produk');
      setImportStatus('error');
    }
  };

  const resetState = () => {
    setParsedProducts([]);
    setDuplicates([]);
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
            Import Produk dari CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Studio Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Pilih Studio Tujuan
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
              Upload File CSV
            </label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Klik untuk upload atau drag & drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: Nama Produk, Link Affiliate, Link Original (opsional)
                </p>
              </label>
            </div>
          </div>

          {/* Validating */}
          {importStatus === 'validating' && (
            <div className="flex items-center gap-2 text-primary text-sm bg-primary/10 p-3 rounded-lg">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Memeriksa duplikasi produk...
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
              Berhasil mengimport {parsedProducts.length} produk!
            </div>
          )}

          {/* Duplicates Warning */}
          {duplicates.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-warning text-sm font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                {duplicates.length} produk duplikat akan dilewati:
              </div>
              <div className="max-h-20 overflow-y-auto">
                {duplicates.slice(0, 5).map((name, index) => (
                  <p key={index} className="text-xs text-muted-foreground truncate">
                    • {name}
                  </p>
                ))}
                {duplicates.length > 5 && (
                  <p className="text-xs text-warning">
                    +{duplicates.length - 5} produk lainnya...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {parsedProducts.length > 0 && importStatus !== 'success' && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">
                Preview: {parsedProducts.length} produk siap diimport
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {parsedProducts.slice(0, 5).map((product, index) => (
                  <p key={index} className="text-xs text-muted-foreground truncate">
                    {product.name}
                  </p>
                ))}
                {parsedProducts.length > 5 && (
                  <p className="text-xs text-primary">
                    +{parsedProducts.length - 5} produk lainnya...
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
              disabled={!selectedStudio || parsedProducts.length === 0 || bulkCreate.isPending || importStatus === 'validating'}
              onClick={handleImport}
            >
              {bulkCreate.isPending ? 'Mengimport...' : `Import ${parsedProducts.length} Produk`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
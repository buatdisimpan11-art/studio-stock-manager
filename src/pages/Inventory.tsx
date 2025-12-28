import { useState } from 'react';
import { Search, Download, Upload, Package, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CsvImportDialog } from '@/components/import/CsvImportDialog';
import { useAllProducts, useProductStats } from '@/hooks/useProducts';
import { useStudios } from '@/hooks/useStudios';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-success/20 text-success border-success/30',
  LIVE: 'bg-primary/20 text-primary border-primary/30',
  COOLDOWN: 'bg-warning/20 text-warning border-warning/30',
  BLACKLIST: 'bg-destructive/20 text-destructive border-destructive/30',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Tersedia',
  LIVE: 'Live',
  COOLDOWN: 'Cooldown',
  BLACKLIST: 'Blacklist',
};

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [studioFilter, setStudioFilter] = useState<string>('ALL');
  const [importOpen, setImportOpen] = useState(false);

  const { data: products, isLoading: productsLoading } = useAllProducts(statusFilter === 'ALL' ? undefined : statusFilter);
  const { data: stats, isLoading: statsLoading } = useProductStats();
  const { data: studios } = useStudios();

  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.affiliate_link.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStudio = studioFilter === 'ALL' || product.studio_id === studioFilter;
    return matchesSearch && matchesStudio;
  });

  const getStudioName = (studioId: string) => {
    const studio = studios?.find(s => s.id === studioId);
    return studio?.name || '-';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout>
      <Header 
        title="Master Inventaris" 
        subtitle="Kelola semua produk di seluruh studio"
        onUploadClick={() => setImportOpen(true)}
      />
      
      <div className="p-8">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="AVAILABLE">Tersedia</SelectItem>
                <SelectItem value="LIVE">Live</SelectItem>
                <SelectItem value="COOLDOWN">Cooldown</SelectItem>
                <SelectItem value="BLACKLIST">Blacklist</SelectItem>
              </SelectContent>
            </Select>

            <Select value={studioFilter} onValueChange={setStudioFilter}>
              <SelectTrigger className="w-48 bg-secondary border-border">
                <SelectValue placeholder="Studio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Studio</SelectItem>
                {studios?.map((studio) => (
                  <SelectItem key={studio.id} value={studio.id}>
                    {studio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-primary" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Total Produk</p>
            <p className="text-2xl font-bold text-foreground">{statsLoading ? '...' : stats?.total || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <p className="text-sm text-success">Tersedia</p>
            <p className="text-2xl font-bold text-success">{statsLoading ? '...' : stats?.available || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-primary">Live</p>
            <p className="text-2xl font-bold text-primary">{statsLoading ? '...' : stats?.live || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
            <p className="text-sm text-warning">Cooldown</p>
            <p className="text-2xl font-bold text-warning">{statsLoading ? '...' : stats?.cooldown || 0}</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada produk</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 gap-2"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="w-4 h-4" />
                Import Produk Pertama
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produk</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Studio</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">GMV</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Klik</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.slice(0, 50).map((product) => (
                      <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{product.name}</p>
                              <a 
                                href={product.affiliate_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline truncate max-w-[200px] block"
                              >
                                {product.affiliate_link}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">{getStudioName(product.studio_id)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-xs", statusColors[product.status])}>
                            {statusLabels[product.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-foreground">{formatCurrency(product.gmv)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">{product.clicks}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">{Math.round(product.score).toLocaleString('id-ID')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-4 py-3 border-t border-border bg-secondary/30">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {Math.min(50, filteredProducts.length)} dari {filteredProducts.length} produk
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </AppLayout>
  );
};

export default Inventory;

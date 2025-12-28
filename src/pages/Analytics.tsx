import { TrendingUp, TrendingDown, Minus, Calendar, Download, Loader2, Skull } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useAllProducts, useProductStats } from '@/hooks/useProducts';
import { useStudios } from '@/hooks/useStudios';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const Analytics = () => {
  const { data: products, isLoading: productsLoading } = useAllProducts('LIVE');
  const { data: studios } = useStudios();
  const { data: stats, isLoading: statsLoading } = useProductStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStudioName = (studioId: string | null) => {
    if (!studioId) return 'Global Pool';
    const studio = studios?.find(s => s.id === studioId);
    return studio?.name || '-';
  };

  // Sort products by GMV for top performers
  const topPerformers = [...(products || [])].sort((a, b) => b.gmv - a.gmv).slice(0, 10);
  
  // Find products with low performance (gmv < 500000)
  const deadStock = (products || []).filter(p => p.gmv < 500000).slice(0, 10);

  // Zombie Products: High clicks (>100) but no sales (GMV = 0)
  const zombieProducts = (products || []).filter(p => p.clicks > 100 && p.gmv === 0);

  // Calculate total GMV
  const totalGmv = (products || []).reduce((sum, p) => sum + p.gmv, 0);

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 1000000) return <TrendingUp className="w-4 h-4 text-success" />;
    if (value < 500000) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const isLoading = productsLoading || statsLoading;

  return (
    <AppLayout>
      <Header 
        title="Laporan Analitik" 
        subtitle="Insight performa mingguan"
      />
      
      <div className="p-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              7 Hari Terakhir
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Laporan
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Total GMV Live</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(totalGmv)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">Dari {stats?.live || 0} produk live</span>
                </div>
              </div>
              
              <div className="p-6 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                <p className="text-sm text-muted-foreground mb-1">Top Performer</p>
                <p className="text-3xl font-bold text-foreground">{topPerformers.length}</p>
                <p className="text-sm text-success mt-2">Produk dengan GMV tinggi</p>
              </div>
              
              <div className="p-6 rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
                <p className="text-sm text-muted-foreground mb-1">Peringatan Dead Stock</p>
                <p className="text-3xl font-bold text-foreground">{deadStock.length}</p>
                <p className="text-sm text-destructive mt-2">Performa rendah</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
                <div className="flex items-center gap-2 mb-1">
                  <Skull className="w-4 h-4 text-warning" />
                  <p className="text-sm text-muted-foreground">Zombie Products</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{zombieProducts.length}</p>
                <p className="text-sm text-warning mt-2">Traffic tinggi, 0 penjualan</p>
              </div>
            </div>

            {/* Zombie Products Alert */}
            {zombieProducts.length > 0 && (
              <div className="mb-8 rounded-2xl border border-warning/30 bg-warning/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-warning/20 bg-warning/10">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Skull className="w-5 h-5 text-warning" />
                    Zombie Products - Perlu Investigasi
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Produk dengan traffic tinggi tapi tidak ada konversi penjualan
                  </p>
                </div>
                <div className="divide-y divide-warning/20">
                  {zombieProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="px-6 py-4 hover:bg-warning/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                            <Skull className="w-4 h-4 text-warning" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{getStudioName(product.studio_id)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                            {product.clicks} klik
                          </Badge>
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                            Rp 0
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {zombieProducts.length > 5 && (
                    <div className="px-6 py-3 bg-warning/5">
                      <p className="text-sm text-warning">
                        +{zombieProducts.length - 5} zombie products lainnya
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-success/5">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    Top Performer Minggu Ini
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Produk untuk diprioritaskan host</p>
                </div>
                <div className="divide-y divide-border">
                  {topPerformers.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">Belum ada data produk</p>
                    </div>
                  ) : (
                    topPerformers.map((product, index) => (
                      <div key={product.id} className="px-6 py-4 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                              index < 3 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                            )}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{getStudioName(product.studio_id)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(product.gmv)}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <TrendIcon value={product.gmv} />
                              <span className="text-xs text-muted-foreground">{product.clicks} klik</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dead Stock */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-destructive/5">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-destructive" />
                    Peringatan Dead Stock
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Pertimbangkan untuk dihapus manual</p>
                </div>
                <div className="divide-y divide-border">
                  {deadStock.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">Tidak ada dead stock terdeteksi</p>
                    </div>
                  ) : (
                    deadStock.map((product) => (
                      <div key={product.id} className="px-6 py-4 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{getStudioName(product.studio_id)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-destructive">{formatCurrency(product.gmv)}</p>
                            <p className="text-xs text-muted-foreground">{product.clicks} klik</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Analytics;

import { TrendingUp, TrendingDown, Minus, Calendar, Download } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { studios, allProducts } from '@/data/mockData';
import { cn } from '@/lib/utils';

const generateWeeklyData = () => {
  return allProducts
    .filter(p => p.status === 'LIVE')
    .slice(0, 20)
    .map(product => {
      const studio = studios.find(s => s.id === product.currentStudioId);
      const trend = Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down';
      const avgGmv = product.gmv * (0.8 + Math.random() * 0.4);
      
      return {
        productId: product.id,
        productName: product.name,
        studioName: studio?.name || 'Unknown',
        avgGmv,
        avgClicks: product.clicks,
        trend,
        daysLive: Math.floor(Math.random() * 30) + 1,
        weeklyGmv: [
          avgGmv * 0.9, avgGmv * 1.1, avgGmv * 0.95, 
          avgGmv * 1.05, avgGmv * 1.0, avgGmv * 0.85, avgGmv * 1.15
        ],
      };
    });
};

const weeklyData = generateWeeklyData();
const topPerformers = [...weeklyData].sort((a, b) => b.avgGmv - a.avgGmv).slice(0, 10);
const deadStock = weeklyData.filter(p => p.daysLive > 7 && p.avgGmv < 500000);

const Analytics = () => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <AppLayout>
      <Header 
        title="Analytics Report" 
        subtitle="Weekly performance insights"
      />
      
      <div className="p-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Last 7 Days
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Total Weekly GMV</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(topPerformers.reduce((sum, p) => sum + p.avgGmv * 7, 0))}</p>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-success">+12.5% vs last week</span>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <p className="text-sm text-muted-foreground mb-1">Top Performers</p>
            <p className="text-3xl font-bold text-foreground">{topPerformers.length}</p>
            <p className="text-sm text-success mt-2">Products with consistent high GMV</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
            <p className="text-sm text-muted-foreground mb-1">Dead Stock Alert</p>
            <p className="text-3xl font-bold text-foreground">{deadStock.length}</p>
            <p className="text-sm text-destructive mt-2">&gt;7 days with low performance</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-success/5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Top Performers This Week
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Products to prioritize for hosts</p>
            </div>
            <div className="divide-y divide-border">
              {topPerformers.map((product, index) => (
                <div key={product.productId} className="px-6 py-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                        index < 3 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">{product.studioName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(product.avgGmv)}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <TrendIcon trend={product.trend} />
                        <span className="text-xs text-muted-foreground">{product.daysLive}d live</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dead Stock */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-destructive/5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                Dead Stock Alert
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Consider manual removal</p>
            </div>
            <div className="divide-y divide-border">
              {deadStock.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-muted-foreground">No dead stock detected</p>
                </div>
              ) : (
                deadStock.map((product) => (
                  <div key={product.productId} className="px-6 py-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">{product.studioName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-destructive">{formatCurrency(product.avgGmv)}</p>
                        <p className="text-xs text-muted-foreground">{product.daysLive} days live</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;

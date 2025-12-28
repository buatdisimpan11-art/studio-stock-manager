import { useState } from 'react';
import { Search, Filter, Upload, Download, Package } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { allProducts, studios } from '@/data/mockData';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-success/20 text-success border-success/30',
  LIVE: 'bg-primary/20 text-primary border-primary/30',
  COOLDOWN: 'bg-warning/20 text-warning border-warning/30',
  BLACKLIST: 'bg-destructive/20 text-destructive border-destructive/30',
};

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.link.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStudioName = (studioId: string | null) => {
    if (!studioId) return '-';
    const studio = studios.find(s => s.id === studioId);
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
        title="Master Inventory" 
        subtitle="Manage all products across studios"
      />
      
      <div className="p-8">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {['ALL', 'AVAILABLE', 'LIVE', 'COOLDOWN', 'BLACKLIST'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "text-xs",
                    statusFilter === status && "bg-primary"
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-primary">
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold text-foreground">{allProducts.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <p className="text-sm text-success">Available</p>
            <p className="text-2xl font-bold text-success">{allProducts.filter(p => p.status === 'AVAILABLE').length}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-primary">Live</p>
            <p className="text-2xl font-bold text-primary">{allProducts.filter(p => p.status === 'LIVE').length}</p>
          </div>
          <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
            <p className="text-sm text-warning">Cooldown</p>
            <p className="text-2xl font-bold text-warning">{allProducts.filter(p => p.status === 'COOLDOWN').length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Studio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">GMV</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clicks</th>
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
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.link}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{product.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-xs", statusColors[product.status])}>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{getStudioName(product.currentStudioId)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{formatCurrency(product.gmv)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{product.clicks}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-4 py-3 border-t border-border bg-secondary/30">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(50, filteredProducts.length)} of {filteredProducts.length} products
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Inventory;

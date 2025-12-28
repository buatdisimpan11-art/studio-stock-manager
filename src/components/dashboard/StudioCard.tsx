import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { StudioRotation } from '@/types/database';
import { ProductCard } from './ProductCard';
import { useMarkProductRemoved, useMarkProductAdded } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface StudioCardProps {
  rotation: StudioRotation;
}

export function StudioCard({ rotation }: StudioCardProps) {
  const [completedRemove, setCompletedRemove] = useState<Set<string>>(new Set());
  const [completedAdd, setCompletedAdd] = useState<Set<string>>(new Set());
  
  const markRemoved = useMarkProductRemoved();
  const markAdded = useMarkProductAdded();

  const handleMarkRemove = async (productId: string) => {
    await markRemoved.mutateAsync(productId);
    setCompletedRemove(prev => new Set(prev).add(productId));
  };

  const handleMarkAdd = async (productId: string) => {
    await markAdded.mutateAsync(productId);
    setCompletedAdd(prev => new Set(prev).add(productId));
  };

  const removeComplete = completedRemove.size;
  const addComplete = completedAdd.size;
  const allComplete = removeComplete >= rotation.toRemove.length && addComplete >= rotation.toAdd.length;

  return (
    <div 
      className={cn(
        "rounded-2xl border transition-all duration-300 overflow-hidden animate-slide-up",
        allComplete 
          ? "bg-card/50 border-success/30" 
          : "bg-gradient-card border-border shadow-card hover:shadow-elevated"
      )}
    >
      {/* Header */}
      <div 
        className="px-5 py-4 border-b border-border flex items-center justify-between"
        style={{ 
          background: `linear-gradient(135deg, ${rotation.studio.color}15, transparent)` 
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full animate-pulse-subtle"
            style={{ backgroundColor: rotation.studio.color }}
          />
          <div>
            <h3 className="font-bold text-foreground">{rotation.studio.name}</h3>
            <p className="text-xs text-muted-foreground">{rotation.studio.category}</p>
          </div>
        </div>
        
        {allComplete ? (
          <div className="flex items-center gap-2 text-success text-sm font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Selesai
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {removeComplete + addComplete}/{rotation.toRemove.length + rotation.toAdd.length} tugas selesai
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 divide-x divide-border">
        {/* OUT Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">KELUAR</p>
              <p className="text-xs text-muted-foreground">{removeComplete}/{rotation.toRemove.length} dihapus</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {rotation.toRemove.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada produk untuk dirotasi</p>
            ) : (
              rotation.toRemove.map((item) => (
                <ProductCard
                  key={item.product.id}
                  product={item.product}
                  type="remove"
                  isComplete={completedRemove.has(item.product.id)}
                  isLoading={markRemoved.isPending}
                  onMarkComplete={() => handleMarkRemove(item.product.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* IN Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">MASUK</p>
              <p className="text-xs text-muted-foreground">{addComplete}/{rotation.toAdd.length} ditambahkan</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {rotation.toAdd.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada produk tersedia</p>
            ) : (
              rotation.toAdd.map((item) => (
                <ProductCard
                  key={item.product.id}
                  product={item.product}
                  type="add"
                  isComplete={completedAdd.has(item.product.id)}
                  isLoading={markAdded.isPending}
                  onMarkComplete={() => handleMarkAdd(item.product.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

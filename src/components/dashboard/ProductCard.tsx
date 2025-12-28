import { useState } from 'react';
import { Copy, Check, ExternalLink, TrendingDown, TrendingUp, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/database';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  type: 'remove' | 'add';
  onMarkComplete: () => void;
  isComplete: boolean;
  isLoading?: boolean;
}

export function ProductCard({ product, type, onMarkComplete, isComplete, isLoading }: ProductCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(product.link);
      setCopied(true);
      toast.success('Link berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin link');
    }
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
    <div
      className={cn(
        "p-4 rounded-xl border transition-all duration-300 animate-scale-in",
        isComplete
          ? "bg-muted/30 border-muted opacity-60"
          : type === 'remove'
          ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
          : "bg-success/5 border-success/20 hover:border-success/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-semibold text-sm truncate",
            isComplete ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {product.name}
          </h4>
          
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCopyLink}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                copied
                  ? "bg-success text-success-foreground"
                  : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin Link
                </>
              )}
            </button>
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </a>
          </div>

          {type === 'remove' && (
            <div className="flex items-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5 text-destructive">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{formatCurrency(product.gmv)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MousePointer className="w-3.5 h-3.5" />
                <span>{product.clicks} klik</span>
              </div>
            </div>
          )}

          {type === 'add' && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-success">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Siap tampil</span>
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant={isComplete ? "ghost" : type === 'remove' ? "destructive" : "default"}
          onClick={onMarkComplete}
          disabled={isComplete || isLoading}
          className={cn(
            "shrink-0 text-xs",
            !isComplete && type === 'add' && "bg-gradient-success hover:opacity-90"
          )}
        >
          {isComplete ? (
            <Check className="w-4 h-4" />
          ) : type === 'remove' ? (
            'Hapus'
          ) : (
            'Tambah'
          )}
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { StudioRotation, RotationItem } from '@/types';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';

interface StudioCardProps {
  rotation: StudioRotation;
}

export function StudioCard({ rotation }: StudioCardProps) {
  const [toRemove, setToRemove] = useState<RotationItem[]>(rotation.toRemove);
  const [toAdd, setToAdd] = useState<RotationItem[]>(rotation.toAdd);

  const handleMarkRemove = (index: number) => {
    setToRemove(prev => prev.map((item, i) => 
      i === index ? { ...item, markedComplete: true } : item
    ));
  };

  const handleMarkAdd = (index: number) => {
    setToAdd(prev => prev.map((item, i) => 
      i === index ? { ...item, markedComplete: true } : item
    ));
  };

  const allComplete = toRemove.every(i => i.markedComplete) && toAdd.every(i => i.markedComplete);
  const removeComplete = toRemove.filter(i => i.markedComplete).length;
  const addComplete = toAdd.filter(i => i.markedComplete).length;

  return (
    <div 
      className={cn(
        "rounded-2xl border transition-all duration-300 overflow-hidden animate-slide-up",
        allComplete 
          ? "bg-card/50 border-success/30" 
          : "bg-gradient-card border-border shadow-card hover:shadow-elevated"
      )}
      style={{
        animationDelay: `${parseInt(rotation.studio.id.split('-')[1]) * 50}ms`
      }}
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
            Complete
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {removeComplete + addComplete}/4 tasks done
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
              <p className="text-sm font-semibold text-destructive">OUT</p>
              <p className="text-xs text-muted-foreground">{removeComplete}/{toRemove.length} removed</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {toRemove.map((item, index) => (
              <ProductCard
                key={item.product.id}
                product={item.product}
                type="remove"
                isComplete={item.markedComplete}
                onMarkComplete={() => handleMarkRemove(index)}
              />
            ))}
          </div>
        </div>

        {/* IN Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">IN</p>
              <p className="text-xs text-muted-foreground">{addComplete}/{toAdd.length} added</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {toAdd.map((item, index) => (
              <ProductCard
                key={item.product.id}
                product={item.product}
                type="add"
                isComplete={item.markedComplete}
                onMarkComplete={() => handleMarkAdd(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

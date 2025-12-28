import { Bell, Upload, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onUploadClick?: () => void;
}

export function Header({ title, subtitle, onUploadClick }: HeaderProps) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="flex items-center justify-between py-6 px-8 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
          <Calendar className="w-4 h-4" />
          <span>{today}</span>
        </div>

        {onUploadClick && (
          <Button variant="outline" size="sm" className="gap-2" onClick={onUploadClick}>
            <Upload className="w-4 h-4" />
            Upload Data
          </Button>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
            3
          </span>
        </Button>
      </div>
    </header>
  );
}

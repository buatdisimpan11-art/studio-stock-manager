import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  Settings, 
  Zap,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudios } from '@/hooks/useStudios';
import { useProductStats } from '@/hooks/useProducts';

const navigation = [
  { name: 'Dashboard Aksi', href: '/', icon: Zap },
  { name: 'Master Inventaris', href: '/inventory', icon: Package },
  { name: 'Analitik', href: '/analytics', icon: BarChart3 },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { data: studios } = useStudios();
  const { data: stats } = useProductStats();

  const totalLive = stats?.live || 0;
  const studioCount = studios?.length || 0;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
            <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg tracking-tight">LiveStream</h1>
            <p className="text-xs text-muted-foreground font-medium">Optima Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-glow-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="px-4 py-3 rounded-lg bg-sidebar-accent">
          <p className="text-xs text-muted-foreground">Studio Aktif</p>
          <p className="text-2xl font-bold text-foreground">{studioCount}</p>
          <p className="text-xs text-primary mt-1">{totalLive} produk live</p>
        </div>
      </div>
    </aside>
  );
}

import { Package, ArrowRightLeft, Clock, AlertTriangle } from 'lucide-react';
import { useProductStats } from '@/hooks/useProducts';
import { useStudios } from '@/hooks/useStudios';

export function StatsBar() {
  const { data: stats, isLoading: statsLoading } = useProductStats();
  const { data: studios, isLoading: studiosLoading } = useStudios();

  const studioCount = studios?.length || 0;
  const dailyRotation = studios?.reduce((sum, s) => sum + s.daily_rotation, 0) || 0;

  const statItems = [
    {
      label: 'Total Produk',
      value: statsLoading ? '...' : stats?.total.toString() || '0',
      change: `${stats?.live || 0} live`,
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Rotasi Pending',
      value: dailyRotation.toString(),
      change: `${studioCount} studio × rotasi`,
      icon: ArrowRightLeft,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Dalam Cooldown',
      value: statsLoading ? '...' : stats?.cooldown.toString() || '0',
      change: 'Dibekukan sementara',
      icon: Clock,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    {
      label: 'Tersedia',
      value: statsLoading ? '...' : stats?.available.toString() || '0',
      change: 'Siap ditambahkan',
      icon: Package,
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {statItems.map((stat, index) => (
        <div
          key={stat.label}
          className="p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className={`text-xs mt-2 ${stat.color}`}>{stat.change}</p>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { Package, ArrowRightLeft, Clock, AlertTriangle } from 'lucide-react';

const stats = [
  {
    label: 'Total Products',
    value: '800',
    change: '+12 this week',
    icon: Package,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Pending Rotations',
    value: '14',
    change: '7 studios × 2',
    icon: ArrowRightLeft,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    label: 'In Cooldown',
    value: '23',
    change: '5 expiring today',
    icon: Clock,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
  {
    label: 'Dead Stock Alert',
    value: '8',
    change: '>7 days low perf',
    icon: AlertTriangle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
];

export function StatsBar() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
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

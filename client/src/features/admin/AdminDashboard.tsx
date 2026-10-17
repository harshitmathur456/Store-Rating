import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Users, Store, Star, Loader2, AlertCircle } from 'lucide-react';

interface DashboardData {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<{ data: DashboardData }>('/admin/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-[13px] text-zinc-600">Failed to load dashboard data.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-[13px] text-accent hover:text-accent-hover font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = data?.data;
  if (!stats) return null;

  const cards = [
    {
      label: 'Total users',
      value: stats.totalUsers,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Total stores',
      value: stats.totalStores,
      icon: Store,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Total ratings',
      value: stats.totalRatings,
      icon: Star,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold text-zinc-900 mb-5">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-zinc-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-zinc-500 font-medium">{card.label}</span>
              <div className={`w-8 h-8 rounded-md ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-zinc-900 tabular-nums">
              {stats ? card.value.toLocaleString() : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

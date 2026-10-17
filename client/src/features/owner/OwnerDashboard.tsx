import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  Star,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Clock,
  Mail,
  MapPin,
  Building,
} from 'lucide-react';
import { api } from '../../lib/api';
import { StarRating } from '../../components/ui/StarRating';
import { Pagination } from '../../components/ui/Pagination';

interface OwnerStore {
  id: string;
  name: string;
  email: string;
  address: string;
}

interface OwnerDashboardData {
  store: OwnerStore | null;
  avgRating: number | null;
  ratingCount: number;
}

interface RaterItem {
  name: string;
  email: string;
  rating: number;
  createdAt: string;
}

interface RatersApiResponse {
  data: RaterItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export default function OwnerDashboard() {
  // Sorting and pagination for raters table
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'date'>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch store owner dashboard summary
  const { data: dashboardRes, isLoading: isDashboardLoading, error: dashboardError } = useQuery<{
    data: OwnerDashboardData;
  }>({
    queryKey: ['owner', 'dashboard'],
    queryFn: () => api.get<{ data: OwnerDashboardData }>('/owner/dashboard'),
  });

  const dashboardData = dashboardRes?.data;
  const hasStore = !!dashboardData?.store;

  // Fetch raters table (only if owner has an assigned store)
  const {
    data: ratersData,
    isLoading: isRatersLoading,
    isFetching: isRatersFetching,
    error: ratersError,
  } = useQuery<RatersApiResponse>({
    queryKey: ['owner', 'ratings', { sortBy, order, page, pageSize }],
    queryFn: () => {
      const params = new URLSearchParams({
        sortBy,
        order,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      return api.get<RatersApiResponse>(`/owner/ratings?${params.toString()}`);
    },
    enabled: hasStore,
  });

  const handleSort = (field: 'name' | 'rating' | 'date') => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder(field === 'date' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  if (isDashboardLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span className="text-xs text-zinc-500">Loading your store dashboard...</span>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
        <p className="text-sm font-semibold text-zinc-900">Failed to load dashboard</p>
        <p className="text-xs text-zinc-500 mt-1">Unable to retrieve store details at this moment.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-3 py-1.5 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-800 hover:bg-zinc-200"
        >
          Retry
        </button>
      </div>
    );
  }

  // FR-O4: Informative empty state if no store assigned
  if (!hasStore) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 shadow-2xs">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
          <Building className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">No Store Assigned Yet</h2>
        <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
          Your account is registered as a Store Owner, but an administrator has not yet assigned a store to your account.
        </p>
        <div className="mt-6 p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-left text-xs text-zinc-600 space-y-1.5">
          <p className="font-semibold text-zinc-900">What happens next?</p>
          <p>1. A System Administrator creates or updates a store profile.</p>
          <p>2. Once assigned, your store metrics and user reviews will appear here automatically.</p>
        </div>
      </div>
    );
  }

  const { store, avgRating, ratingCount } = dashboardData!;

  return (
    <div className="space-y-6">
      {/* Store Header Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 text-accent">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{store?.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Store
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  {store?.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {store?.address}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards - 2 key metrics per FR-O2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Average Store Rating
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 tabular-nums">
              {avgRating !== null ? avgRating.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-zinc-400 font-medium">/ 5.0</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            {avgRating !== null
              ? `Calculated across ${ratingCount} verified ratings`
              : 'No customers have rated this store yet'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Customer Ratings
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 tabular-nums">
              {ratingCount.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-400 font-medium">ratings submitted</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Individual user feedback submissions recorded
          </p>
        </div>
      </div>

      {/* Raters Table Section */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Customer Ratings History</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Detailed list of users who reviewed your store, their submitted score and date
            </p>
          </div>
        </div>

        {isRatersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-xs text-zinc-500">Loading raters list...</span>
          </div>
        ) : ratersError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-medium text-zinc-900">Failed to load ratings</p>
            <p className="text-xs text-zinc-500 mt-1">An error occurred while fetching reviews.</p>
          </div>
        ) : ratersData && ratersData.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3 text-zinc-400">
              <Star className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900">No Ratings Yet</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Customers haven't submitted any ratings for your store yet. When they do, they will appear right here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            {isRatersFetching && (
              <div className="absolute top-0 inset-x-0 h-0.5 bg-accent/20">
                <div className="h-full bg-accent animate-pulse" />
              </div>
            )}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-semibold uppercase tracking-wider select-none">
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3 px-4 cursor-pointer hover:bg-zinc-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Customer Name</span>
                      {sortBy === 'name' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4">
                    <span>Email Address</span>
                  </th>

                  <th
                    onClick={() => handleSort('rating')}
                    className="py-3 px-4 cursor-pointer hover:bg-zinc-100 transition-colors w-44"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Rating Given</span>
                      {sortBy === 'rating' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:bg-zinc-100 transition-colors w-44"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {sortBy === 'date' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {ratersData?.data.map((rater, idx) => (
                  <tr key={`${rater.email}-${idx}`} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                      {rater.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600 whitespace-nowrap">
                      {rater.email}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StarRating value={rater.rating} size="sm" showLabel={false} />
                        <span className="font-bold text-zinc-900">{rater.rating} / 5</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap flex items-center gap-1.5 mt-2">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {new Date(rater.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {ratersData && ratersData.meta.total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={ratersData.meta.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}

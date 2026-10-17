import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  X,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { StarRating } from '../../components/ui/StarRating';
import { Pagination } from '../../components/ui/Pagination';

interface UserStoreItem {
  id: string;
  name: string;
  email: string;
  address: string;
  avgRating: number | null;
  ratingCount: number;
  myRating: number | null;
}

interface UserStoresApiResponse {
  data: UserStoreItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export default function UserStoresPage() {
  const queryClient = useQueryClient();

  // Search input state (immediate for typing)
  const [nameInput, setNameInput] = useState('');
  const [addressInput, setAddressInput] = useState('');

  // Debounced search state (300ms)
  const [debouncedName, setDebouncedName] = useState('');
  const [debouncedAddress, setDebouncedAddress] = useState('');

  // Sorting & pagination
  const [sortBy, setSortBy] = useState<'name' | 'avgRating'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce effect (300ms per PRD FR-U3)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(nameInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [nameInput]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAddress(addressInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [addressInput]);

  const queryKey = [
    'user',
    'stores',
    { debouncedName, debouncedAddress, sortBy, order, page, pageSize },
  ];

  // Fetch stores
  const { data, isLoading, isFetching, error, refetch } = useQuery<UserStoresApiResponse>({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        order,
      });
      if (debouncedName.trim()) params.append('name', debouncedName.trim());
      if (debouncedAddress.trim()) params.append('address', debouncedAddress.trim());

      return api.get<UserStoresApiResponse>(`/stores?${params.toString()}`);
    },
  });

  // Optimistic rating mutation (FR-U5, FR-U6)
  const ratingMutation = useMutation({
    mutationFn: ({ storeId, rating }: { storeId: string; rating: number }) =>
      api.put<{ data: { storeId: string; avgRating: number | null; ratingCount: number; myRating: number } }>(
        `/stores/${storeId}/rating`,
        { rating }
      ),
    onMutate: async ({ storeId, rating }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<UserStoresApiResponse>(queryKey);

      // Optimistically update the store in cache
      if (previousData) {
        queryClient.setQueryData<UserStoresApiResponse>(queryKey, {
          ...previousData,
          data: previousData.data.map((s) => {
            if (s.id !== storeId) return s;

            // Recalculate optimistic average
            const prevMyRating = s.myRating;
            let newCount = s.ratingCount;
            let newSum = (s.avgRating || 0) * s.ratingCount;

            if (prevMyRating === null) {
              newCount += 1;
              newSum += rating;
            } else {
              newSum = newSum - prevMyRating + rating;
            }

            const newAvg = newCount > 0 ? Math.round((newSum / newCount) * 10) / 10 : rating;

            return {
              ...s,
              myRating: rating,
              avgRating: newAvg,
              ratingCount: newCount,
            };
          }),
        });
      }

      return { previousData };
    },
    onError: (err: any, _vars, context) => {
      // Rollback on failure
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(err.data?.error?.message || err.message || 'Failed to submit rating');
    },
    onSuccess: (res, { storeId }) => {
      toast.success('Rating updated successfully');
      // Sync with server's calculated average
      if (res?.data) {
        queryClient.setQueryData<UserStoresApiResponse>(queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((s) => (s.id === storeId ? { ...s, ...res.data } : s)),
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'stores'] });
    },
  });

  const handleRate = (storeId: string, rating: number) => {
    ratingMutation.mutate({ storeId, rating });
  };

  const handleSort = (field: 'name' | 'avgRating') => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder(field === 'avgRating' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const clearSearch = () => {
    setNameInput('');
    setAddressInput('');
    setPage(1);
  };

  const hasSearch = Boolean(nameInput || addressInput);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-accent" />
            Explore & Rate Stores
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Browse registered stores, view overall ratings, and submit or modify your personal rating
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-zinc-400" /> Search Stores
          </span>
          {hasSearch && (
            <button
              onClick={clearSearch}
              className="text-xs text-accent hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear search
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">Store Name</label>
            <input
              type="text"
              placeholder="Search by store name (e.g. Organic, Bakery)..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">Address / Location</label>
            <input
              type="text"
              placeholder="Search by address or street..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Stores Table View */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-xs text-zinc-500">Searching stores...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-medium text-zinc-900">Failed to load stores</p>
            <p className="text-xs text-zinc-500 mt-1">An error occurred while communicating with the server.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3 py-1.5 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-800 hover:bg-zinc-200"
            >
              Retry
            </button>
          </div>
        ) : data && data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
              <Store className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">No stores found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {hasSearch
                ? 'No stores match your search terms. Try searching with different keywords.'
                : 'There are currently no stores available for rating.'}
            </p>
            {hasSearch && (
              <button
                onClick={clearSearch}
                className="mt-3 text-xs text-accent font-medium hover:underline cursor-pointer"
              >
                Clear search criteria
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            {isFetching && (
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
                      <span>Store Name & Info</span>
                      {sortBy === 'name' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4">
                    <span>Address</span>
                  </th>

                  <th
                    onClick={() => handleSort('avgRating')}
                    className="py-3 px-4 cursor-pointer hover:bg-zinc-100 transition-colors w-48"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Overall Rating</span>
                      {sortBy === 'avgRating' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4 w-52 text-right">
                    <span>Your Rating (Click to Rate)</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data?.data.map((store) => (
                  <tr key={store.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-accent/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Store className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-900 block leading-tight">
                            {store.name}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400 mt-0.5 block">
                            {store.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-600 max-w-sm truncate" title={store.address}>
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StarRating
                        value={store.avgRating}
                        count={store.ratingCount}
                        size="sm"
                      />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="inline-flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <StarRating
                            value={store.myRating}
                            interactive={true}
                            onChange={(rating) => handleRate(store.id, rating)}
                            size="md"
                            showLabel={false}
                          />
                        </div>
                        <span className="text-[11px] text-zinc-500">
                          {store.myRating ? (
                            <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              You rated: {store.myRating}/5 (Click to change)
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">Not rated yet</span>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data.meta.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}

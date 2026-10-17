import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Store,
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { createStoreSchema, type CreateStoreInput } from '../../lib/schemas';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { StarRating } from '../../components/ui/StarRating';

interface StoreItem {
  id: string;
  name: string;
  email: string;
  address: string;
  ownerId?: string | null;
  avgRating: number | null;
  ratingCount: number;
}

interface AvailableOwner {
  id: string;
  name: string;
  email: string;
}

interface StoresApiResponse {
  data: StoreItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export default function StoresPage() {
  const queryClient = useQueryClient();

  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');

  // Sorting & pagination
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'address' | 'rating'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);

  // Fetch stores
  const { data, isLoading, isFetching, error, refetch } = useQuery<StoresApiResponse>({
    queryKey: ['admin', 'stores', { nameFilter, emailFilter, addressFilter, sortBy, order, page, pageSize }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        order,
      });
      if (nameFilter.trim()) params.append('name', nameFilter.trim());
      if (emailFilter.trim()) params.append('email', emailFilter.trim());
      if (addressFilter.trim()) params.append('address', addressFilter.trim());

      return api.get<StoresApiResponse>(`/admin/stores?${params.toString()}`);
    },
  });

  // Fetch available owners
  const { data: ownersData } = useQuery<{ data: AvailableOwner[] }>({
    queryKey: ['admin', 'owners', 'available'],
    queryFn: () => api.get<{ data: AvailableOwner[] }>('/admin/owners/available'),
    enabled: isAddStoreOpen,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStoreInput>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: '',
      email: '',
      address: '',
      ownerId: null,
    },
    mode: 'onBlur',
  });

  const createStoreMutation = useMutation({
    mutationFn: (formData: CreateStoreInput) => {
      const payload = {
        ...formData,
        ownerId: formData.ownerId ? formData.ownerId : null,
      };
      return api.post('/admin/stores', payload);
    },
    onSuccess: () => {
      toast.success('Store created successfully');
      setIsAddStoreOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'owners', 'available'] });
    },
    onError: (err: any) => {
      const msg = err.data?.error?.message || err.message || 'Failed to create store';
      toast.error(msg);
    },
  });

  const onSubmit = (formData: CreateStoreInput) => {
    createStoreMutation.mutate(formData);
  };

  const handleSort = (field: 'name' | 'email' | 'address' | 'rating') => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setAddressFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(nameFilter || emailFilter || addressFilter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-accent" />
            Stores Management
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Register and manage stores across the platform with full sorting and filtering
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            setIsAddStoreOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Store
        </button>
      </div>

      {/* Filter Toolbar - utilizing full width */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-zinc-400" /> Filters
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-accent hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">Store Name</label>
            <input
              type="text"
              placeholder="Filter by store name..."
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">Email</label>
            <input
              type="text"
              placeholder="Filter by store email..."
              value={emailFilter}
              onChange={(e) => {
                setEmailFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">Address</label>
            <input
              type="text"
              placeholder="Filter by address..."
              value={addressFilter}
              onChange={(e) => {
                setAddressFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-xs text-zinc-500">Loading stores...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-medium text-zinc-900">Failed to load stores</p>
            <p className="text-xs text-zinc-500 mt-1">An error occurred while fetching store data.</p>
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
              {hasActiveFilters
                ? 'No stores match your current filters. Try resetting the search terms.'
                : 'No stores have been registered yet. Click "Add Store" to create one.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-xs text-accent font-medium hover:underline cursor-pointer"
              >
                Clear all filters
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
                      <span>Store Name</span>
                      {sortBy === 'name' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('email')}
                    className="py-3 px-4 cursor-pointer hover:bg-zinc-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Email</span>
                      {sortBy === 'email' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('address')}
                    className="py-3 px-4 cursor-pointer hover:bg-zinc-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Address</span>
                      {sortBy === 'address' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('rating')}
                    className="py-3 px-4 cursor-pointer hover:bg-zinc-100 transition-colors w-44"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Rating</span>
                      {sortBy === 'rating' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data?.data.map((store) => (
                  <tr key={store.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-zinc-400" />
                        <span>{store.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-mono text-[11px] whitespace-nowrap">
                      {store.email}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 max-w-sm truncate" title={store.address}>
                      {store.address}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StarRating
                        value={store.avgRating}
                        count={store.ratingCount}
                        size="sm"
                      />
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

      {/* Add Store Modal */}
      <Modal
        isOpen={isAddStoreOpen}
        onClose={() => setIsAddStoreOpen(false)}
        title="Add New Store"
        description="Register a new store entity with an optional store owner assignment."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store Name <span className="text-rose-500">*</span>
              <span className="text-[11px] text-zinc-400 font-normal ml-1">(20 to 60 characters)</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. Evergreen Organics Grocery Store"
              className={`w-full h-9 px-3 text-xs rounded-lg border ${
                errors.name ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-300'
              } focus:border-accent focus:outline-none`}
            />
            {errors.name && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store Email <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="contact@store.com"
              className={`w-full h-9 px-3 text-xs rounded-lg border ${
                errors.email ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-300'
              } focus:border-accent focus:outline-none`}
            />
            {errors.email && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store Address <span className="text-rose-500">*</span>
              <span className="text-[11px] text-zinc-400 font-normal ml-1">(max 400 characters)</span>
            </label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Physical street address..."
              className={`w-full p-2.5 text-xs rounded-lg border ${
                errors.address ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-300'
              } focus:border-accent focus:outline-none`}
            />
            {errors.address && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store Owner <span className="text-zinc-400 font-normal">(Optional)</span>
            </label>
            <select
              {...register('ownerId')}
              className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-300 focus:border-accent focus:outline-none bg-white font-medium text-zinc-800"
            >
              <option value="">No owner assigned yet</option>
              {ownersData?.data?.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} ({owner.email})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-400 mt-1">
              Only unassigned Store Owners are listed here.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsAddStoreOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStoreMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
            >
              {createStoreMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Store
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users,
  UserPlus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  Store,
  Mail,
  MapPin,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { createUserSchema, type CreateUserInput } from '../../lib/schemas';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';

interface UserItem {
  id: string;
  name: string;
  email: string;
  address: string;
  role: 'ADMIN' | 'USER' | 'OWNER';
  createdAt: string;
}

interface UserDetail extends UserItem {
  storeName?: string | null;
  storeRating?: number | string;
}

interface UsersApiResponse {
  data: UserItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const roleBadge: Record<string, { label: string; className: string }> = {
  ADMIN: { label: 'Admin', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  USER: { label: 'User', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OWNER: { label: 'Store Owner', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function UsersPage() {
  const queryClient = useQueryClient();

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Sorting & pagination state
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'address' | 'role'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch users list
  const { data, isLoading, isFetching, error, refetch } = useQuery<UsersApiResponse>({
    queryKey: ['admin', 'users', { nameFilter, emailFilter, addressFilter, roleFilter, sortBy, order, page, pageSize }],
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
      if (roleFilter) params.append('role', roleFilter);

      return api.get<UsersApiResponse>(`/admin/users?${params.toString()}`);
    },
  });

  // Fetch single user detail
  const { data: userDetailData, isLoading: isDetailLoading } = useQuery<{ data: UserDetail }>({
    queryKey: ['admin', 'users', selectedUserId],
    queryFn: () => api.get<{ data: UserDetail }>(`/admin/users/${selectedUserId}`),
    enabled: !!selectedUserId,
  });

  // Create user form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      address: '',
      role: 'USER',
    },
    mode: 'onBlur',
  });

  const watchedPassword = watch('password', '');
  const pwdChecks = {
    length: watchedPassword.length >= 8 && watchedPassword.length <= 16,
    uppercase: /[A-Z]/.test(watchedPassword),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(watchedPassword),
  };

  const createUserMutation = useMutation({
    mutationFn: (formData: CreateUserInput) => api.post('/admin/users', formData),
    onSuccess: () => {
      toast.success('User created successfully');
      setIsAddUserOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err: any) => {
      const msg = err.data?.error?.message || err.message || 'Failed to create user';
      toast.error(msg);
    },
  });

  const onSubmit = (formData: CreateUserInput) => {
    createUserMutation.mutate(formData);
  };

  const handleSort = (field: 'name' | 'email' | 'address' | 'role') => {
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
    setRoleFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(nameFilter || emailFilter || addressFilter || roleFilter);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Users Management
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            View, filter, sort and register platform users and store owners
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            setIsAddUserOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add User
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">Name</label>
            <input
              type="text"
              placeholder="Filter by name..."
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
              placeholder="Filter by email..."
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

          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-accent focus:outline-none transition-colors font-medium text-zinc-800"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">System Administrator</option>
              <option value="USER">Normal User</option>
              <option value="OWNER">Store Owner</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-xs text-zinc-500">Loading users...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-medium text-zinc-900">Failed to load users</p>
            <p className="text-xs text-zinc-500 mt-1">An error occurred while fetching user data.</p>
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
              <Users className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">No users found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {hasActiveFilters
                ? 'No users match your active filter criteria. Try adjusting your search query.'
                : 'No users have registered or been created on this platform yet.'}
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
                      <span>Name</span>
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
                    onClick={() => handleSort('role')}
                    className="py-3 px-4 cursor-pointer hover:bg-zinc-100 transition-colors w-32"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Role</span>
                      {sortBy === 'role' ? (
                        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data?.data.map((user) => {
                  const badge = roleBadge[user.role] || { label: user.role, className: 'bg-zinc-100 text-zinc-800' };
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <td className="py-3 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                        {user.name}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 font-mono text-[11px] whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 max-w-xs truncate" title={user.address}>
                        {user.address}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(user.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-200 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 hover:text-accent transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add New User"
        description="Create a new administrator, store owner, or normal user with strict schema validation."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Full Name <span className="text-rose-500">*</span>
              <span className="text-[11px] text-zinc-400 font-normal ml-1">(20 to 60 characters)</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. Johnathan Alexander Smith"
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
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="user@example.com"
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
              Role <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('role')}
              className={`w-full h-9 px-3 text-xs rounded-lg border ${
                errors.role ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-300'
              } focus:border-accent focus:outline-none bg-white font-medium text-zinc-800`}
            >
              <option value="USER">Normal User</option>
              <option value="OWNER">Store Owner</option>
              <option value="ADMIN">System Administrator</option>
            </select>
            {errors.role && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••••••"
              className={`w-full h-9 px-3 text-xs rounded-lg border ${
                errors.password ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-300'
              } focus:border-accent focus:outline-none`}
            />
            {/* Live requirements checklist */}
            <div className="mt-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${pwdChecks.length ? 'text-emerald-700 font-medium' : 'text-zinc-500'}`}>
                {pwdChecks.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-300" />}
                8 to 16 characters
              </div>
              <div className={`flex items-center gap-1.5 ${pwdChecks.uppercase ? 'text-emerald-700 font-medium' : 'text-zinc-500'}`}>
                {pwdChecks.uppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-300" />}
                At least one uppercase letter (A-Z)
              </div>
              <div className={`flex items-center gap-1.5 ${pwdChecks.special ? 'text-emerald-700 font-medium' : 'text-zinc-500'}`}>
                {pwdChecks.special ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-300" />}
                At least one special character (!@#$%^&*...)
              </div>
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Physical Address <span className="text-rose-500">*</span>
              <span className="text-[11px] text-zinc-400 font-normal ml-1">(max 400 characters)</span>
            </label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Full postal address..."
              className={`w-full p-2.5 text-xs rounded-lg border ${
                errors.address ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-300'
              } focus:border-accent focus:outline-none`}
            />
            {errors.address && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.address.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
            >
              {createUserMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* User Detail Drawer / Modal */}
      <Modal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        title="User Details"
        description="Complete profile and associated store rating information."
        maxWidth="md"
      >
        {isDetailLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-xs text-zinc-500">Loading user profile...</span>
          </div>
        ) : userDetailData?.data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                {userDetailData.data.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-zinc-900 truncate">
                  {userDetailData.data.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadge[userDetailData.data.role]?.className}`}>
                    {roleBadge[userDetailData.data.role]?.label || userDetailData.data.role}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    ID: {userDetailData.data.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-zinc-500 block text-[11px]">Email Address</span>
                  <span className="font-mono text-zinc-900 select-all">{userDetailData.data.email}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-zinc-500 block text-[11px]">Address</span>
                  <span className="text-zinc-800">{userDetailData.data.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-zinc-500 block text-[11px]">Account Created</span>
                  <span className="text-zinc-800">
                    {new Date(userDetailData.data.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Store Owner specific information */}
              {userDetailData.data.role === 'OWNER' && (
                <div className="pt-3 border-t border-zinc-200">
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-amber-700" />
                      <span className="font-semibold text-amber-950 text-xs">Assigned Store</span>
                    </div>
                    {userDetailData.data.storeName ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-600 text-[11px]">Store Name:</span>
                          <span className="font-semibold text-zinc-900">{userDetailData.data.storeName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-600 text-[11px]">Average Rating:</span>
                          <span className="font-bold text-amber-800">
                            {typeof userDetailData.data.storeRating === 'number'
                              ? `${userDetailData.data.storeRating.toFixed(1)} / 5.0`
                              : userDetailData.data.storeRating || 'No ratings yet'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-800 italic">No store assigned to this owner.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="px-4 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

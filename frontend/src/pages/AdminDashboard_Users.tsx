import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, RefreshCw, Mail, Phone, Calendar, CheckCircle2, UserX } from 'lucide-react';
import apiClient from '@/api/client';
import { Spinner } from '@/components/shared/Spinner';
import { LineChart } from '@/components/admin/Charts';
import { useDebounce } from '@/hooks/useDebounce';

interface UserItem {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  role: string;
  isProfileComplete: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsersResponse {
  users: UserItem[];
  pagination: PaginationData;
}

interface UserFilters {
  search: string;
  role: 'all' | 'user' | 'admin';
  profile: 'all' | 'complete' | 'incomplete';
  sortBy: 'createdAt' | 'name' | 'email';
  sortOrder: 'asc' | 'desc';
  pageSize: number;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export function UsersAdminTab() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    profile: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    pageSize: 10,
  });

  const debouncedSearch = useDebounce(filters.search, 350);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);

  const [signupWindow, setSignupWindow] = useState<7 | 30>(30);

  const buildParams = (page: number, forChart = false) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(forChart ? 100 : filters.pageSize));
    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);

    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }

    if (filters.role !== 'all') {
      params.set('role', filters.role);
    }

    if (filters.profile !== 'all') {
      params.set('profile', filters.profile);
    }

    return params;
  };

  const getPageNumbers = (current: number, total: number) => {
    const maxButtons = 5;

    if (total <= maxButtons) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, current - half);
    let end = start + maxButtons - 1;

    if (end > total) {
      end = total;
      start = end - maxButtons + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const buildSignupChart = (allUsers: UserItem[]) => {
    const buckets = Array.from({ length: signupWindow }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (signupWindow - 1 - i));
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return { key, label, value: 0 };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    allUsers.forEach((user) => {
      const key = new Date(user.createdAt).toISOString().slice(0, 10);
      const target = bucketMap.get(key);
      if (target) {
        target.value += 1;
      }
    });

    setChartData(buckets.map(({ label, value }) => ({ label, value })));
  };

  const fetchUsers = useCallback(async (page: number = 1) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [resp, chartResp] = await Promise.allSettled([
        apiClient.get<UsersResponse>(`/user/admin/all?${buildParams(page).toString()}`),
        apiClient.get<UsersResponse>(`/user/admin/all?${buildParams(1, true).toString()}`),
      ]);

      if (resp.status === 'rejected') {
        throw resp.reason;
      }

      setUsers(resp.value.data?.users || []);
      setPagination(resp.value.data?.pagination || null);

      if (chartResp.status === 'fulfilled') {
        buildSignupChart(chartResp.value.data?.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setErrorMessage('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.pageSize, filters.profile, filters.role, filters.sortBy, filters.sortOrder, signupWindow]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const totalUsers = pagination?.total || 0;
  const completeProfiles = users.filter((user) => user.isProfileComplete).length;
  const completionRate = users.length > 0 ? Math.round((completeProfiles / users.length) * 100) : 0;

  const pageNumbers = pagination ? getPageNumbers(pagination.page, pagination.totalPages) : [];

  return (
    <motion.div
      key="users"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Signups</h1>
          <p className="mt-1 text-gray-500">Manage accounts with advanced filters and pagination</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalUsers.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Users on this page</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{users.length.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Profile completion (current page)</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{completionRate}%</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900">Signup Trend</h3>
          <div className="rounded-xl border border-gray-200 bg-white p-1">
            {[7, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setSignupWindow(days as 7 | 30)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  signupWindow === days ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Last {days} days
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <LineChart data={chartData} height={200} color="#3b82f6" />
        ) : (
          <div className="h-50 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl">
            Loading chart data...
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-6">
        <div className="relative min-w-60 max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>

        <select
          value={filters.role}
          onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value as UserFilters['role'] }))}
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>

        <select
          value={filters.profile}
          onChange={(e) => setFilters((prev) => ({ ...prev, profile: e.target.value as UserFilters['profile'] }))}
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        >
          <option value="all">All Profiles</option>
          <option value="complete">Complete</option>
          <option value="incomplete">Incomplete</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as UserFilters['sortBy'] }))}
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        >
          <option value="createdAt">Sort: Joined Date</option>
          <option value="name">Sort: Name</option>
          <option value="email">Sort: Email</option>
        </select>

        <select
          value={filters.sortOrder}
          onChange={(e) => setFilters((prev) => ({ ...prev, sortOrder: e.target.value as UserFilters['sortOrder'] }))}
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>

        <select
          value={filters.pageSize}
          onChange={(e) => setFilters((prev) => ({ ...prev, pageSize: Number(e.target.value) || 10 }))}
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>

        <button
          onClick={() => fetchUsers(1)}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Joined Date</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <Spinner size="lg" className="mx-auto" />
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="group transition-colors hover:bg-gray-50/80">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase">
                          {(user.name || user.email).charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.isProfileComplete ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <CheckCircle2 className="h-3 w-3" /> Profile Info Given
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">
                          <UserX className="h-3 w-3" /> Incomplete
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 text-gray-300" />
                      <p className="mt-4 text-sm font-medium text-gray-500">No users found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-medium text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-medium text-gray-900">{pagination.total}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(1)}
              disabled={!pagination.hasPrev}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              First
            </button>
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>

            {pageNumbers.map((pageNo) => (
              <button
                key={pageNo}
                onClick={() => fetchUsers(pageNo)}
                className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition-colors ${
                  pagination.page === pageNo
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNo}
              </button>
            ))}

            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
            <button
              onClick={() => fetchUsers(pagination.totalPages)}
              disabled={!pagination.hasNext}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

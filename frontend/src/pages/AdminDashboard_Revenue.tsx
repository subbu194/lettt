import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, Palette, Calendar } from 'lucide-react';
import apiClient from '@/api/client';
import { Spinner } from '@/components/shared/Spinner';
import { BarChart, LineChart } from '@/components/admin/Charts';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export function RevenueAdminTab() {
  const [loading, setLoading] = useState(true);
  const [artRevenue, setArtRevenue] = useState({ total: 0, today: 0, monthly: 0 });
  const [eventRevenue, setEventRevenue] = useState({ total: 0, today: 0, monthly: 0 });
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [source, setSource] = useState<'all' | 'art' | 'events'>('all');
  const [revenueHistory, setRevenueHistory] = useState<{ label: string; value: number }[]>([]);

  const [periodSourceTotals, setPeriodSourceTotals] = useState({
    art: 0,
    events: 0,
  });

  const buildDayBuckets = (days: number) => {
    const buckets: { key: string; label: string; value: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      buckets.push({ key, label, value: 0 });
    }

    return buckets;
  };

  const aggregateRevenueByDay = (items: Array<{ date: string; total: number }>, days: number) => {
    const buckets = buildDayBuckets(days);
    const map = new Map(buckets.map((b) => [b.key, b]));

    items.forEach((item) => {
      const key = item.date;
      const bucket = map.get(key);
      if (bucket) {
        bucket.value += item.total || 0;
      }
    });

    return buckets.map(({ label, value }) => ({ label, value: Math.round(value) }));
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [artResp, eventResp] = await Promise.all([
        apiClient.get<any>('/art-orders/admin/stats').catch(() => ({ data: { stats: { totalRevenue: 0, todayRevenue: 0, monthlyRevenue: 0 } } })),
        apiClient.get<any>('/ticket-bookings/admin/stats').catch(() => ({ data: { stats: { totalRevenue: 0, todayRevenue: 0, monthlyRevenue: 0 } } })),
      ]);

      const aStats = artResp.data?.stats || {};
      const eStats = eventResp.data?.stats || {};

      setArtRevenue({
        total: aStats.totalRevenue || 0,
        today: aStats.todayRevenue || 0,
        monthly: aStats.monthlyRevenue || 0,
      });

      setEventRevenue({
        total: eStats.totalRevenue || 0,
        today: eStats.todayRevenue || 0,
        monthly: eStats.monthlyRevenue || 0,
      });

      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

      const artPaid = (aStats.revenueByDay || []).map((entry: any) => ({
        date: entry.date,
        total: Number(entry.total) || 0,
      }));

      const eventPaid = (eStats.revenueByDay || []).map((entry: any) => ({
        date: entry.date,
        total: Number(entry.total) || 0,
      }));

      const artHistory = aggregateRevenueByDay(artPaid, days);
      const eventHistory = aggregateRevenueByDay(eventPaid, days);

      const mergedHistory = artHistory.map((artPoint, idx) => ({
        label: artPoint.label,
        value: artPoint.value + (eventHistory[idx]?.value || 0),
      }));

      const selectedHistory =
        source === 'art' ? artHistory : source === 'events' ? eventHistory : mergedHistory;

      setRevenueHistory(selectedHistory);

      setPeriodSourceTotals({
        art: artHistory.reduce((sum, item) => sum + item.value, 0),
        events: eventHistory.reduce((sum, item) => sum + item.value, 0),
      });
    } catch (err) {
      console.error('Failed to fetch revenue stats:', err);
    } finally {
      setLoading(false);
    }
  }, [period, source]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const artRevVal = artRevenue.total;
  const eventRevVal = eventRevenue.total;
  const totalRevVal = artRevVal + eventRevVal;
  const artPercentage = totalRevVal > 0 ? ((artRevVal / totalRevVal) * 100).toFixed(1) : '0';
  const eventPercentage = totalRevVal > 0 ? ((eventRevVal / totalRevVal) * 100).toFixed(1) : '0';

  return (
    <motion.div
      key="revenue"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Breakdown</h1>
          <p className="mt-1 text-gray-500">Understand earnings with standard, production-ready charts</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-gray-200 bg-white p-1">
            {(['7d', '30d', '90d'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  period === value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-1">
            {([
              { label: 'All', value: 'all' },
              { label: 'Art', value: 'art' },
              { label: 'Events', value: 'events' },
            ] as const).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSource(item.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  source === item.value ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 p-6 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-100">
            <IndianRupee className="h-5 w-5" />
            <h3 className="font-medium">Total Revenue</h3>
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight">₹{totalRevVal.toLocaleString('en-IN')}</p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-300">
            <TrendingUp className="h-4 w-4" /> &nbsp; Growing
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Palette className="h-5 w-5 text-amber-500" />
            <h3 className="font-medium text-gray-700">Art Deals</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-900">₹{artRevVal.toLocaleString('en-IN')}</p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{artPercentage}%</span> of total
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-amber-500" style={{ width: `${artPercentage}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-5 w-5 text-rose-500" />
            <h3 className="font-medium text-gray-700">Event Tickets</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-900">₹{eventRevVal.toLocaleString('en-IN')}</p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{eventPercentage}%</span> of total
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-rose-500" style={{ width: `${eventPercentage}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 font-semibold text-gray-900">Source Comparison</h3>
          <BarChart 
            data={[
              { label: `Art (${period.toUpperCase()})`, value: periodSourceTotals.art },
              { label: `Events (${period.toUpperCase()})`, value: periodSourceTotals.events },
            ]} 
            height={220} 
            color="#0ea5e9" 
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 font-semibold text-gray-900">Revenue Trend ({period.toUpperCase()})</h3>
          {revenueHistory.length > 0 ? (
            <LineChart data={revenueHistory} height={220} color="#2563eb" />
          ) : (
            <div className="flex h-55 items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-xl">
              No paid orders found in selected range
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Art Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Today</span>
              <span className="font-medium text-gray-900">₹{artRevenue.today.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">This Month</span>
              <span className="font-medium text-gray-900">₹{artRevenue.monthly.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-gray-900">All Time</span>
              <span className="text-indigo-600">₹{artRevenue.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Events Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Today</span>
              <span className="font-medium text-gray-900">₹{eventRevenue.today.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">This Month</span>
              <span className="font-medium text-gray-900">₹{eventRevenue.monthly.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-gray-900">All Time</span>
              <span className="text-indigo-600">₹{eventRevenue.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

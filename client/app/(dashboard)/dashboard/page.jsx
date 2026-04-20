'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  CreditCardIcon, BuildingOfficeIcon, UserIcon,
  ReceiptRefundIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { formatCurrency, formatShortDate, CHART_COLORS } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/context/AuthContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-100 border border-slate-700 rounded-xl p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [reportRes, suggestionsRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/deduction-suggestions'),
      ]);
      setData({ ...reportRes.data, suggestions: suggestionsRes.data });
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/plaid/sync');
      await fetchData();
    } catch {} finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const byCategory = data?.byCategory || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const topMerchants = data?.topMerchants || [];
  const suggestions = data?.suggestions?.suggestions || [];

  const pieData = byCategory.slice(0, 8).map(c => ({
    name: c.name || 'Uncategorized',
    value: parseFloat(c.total),
  }));

  return (
    <div className="space-y-5 lg:space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-100">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Financial overview {new Date().getFullYear()}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSync}
          disabled={syncing}
          className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap flex-shrink-0"
        >
          <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync Bank'}</span>
        </motion.button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          index={0}
          title="Total Expenses"
          value={formatCurrency(summary.total_amount || 0)}
          subtitle={`${summary.total_count || 0} transactions`}
          icon={CreditCardIcon}
          color="brand"
        />
        <StatCard
          index={1}
          title="Business"
          value={formatCurrency(summary.business_amount || 0)}
          subtitle="This year"
          icon={BuildingOfficeIcon}
          color="brand"
        />
        <StatCard
          index={2}
          title="Personal"
          value={formatCurrency(summary.personal_amount || 0)}
          subtitle="This year"
          icon={UserIcon}
          color="green"
        />
        <StatCard
          index={3}
          title="Tax Deductible"
          value={formatCurrency(summary.total_deductible || 0)}
          subtitle={`${summary.deductible_count || 0} deductible items`}
          icon={ReceiptRefundIcon}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base lg:text-lg font-semibold text-slate-100">Monthly Trend</h2>
              <p className="text-slate-500 text-xs lg:text-sm">12-month expense overview</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyTrend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradBusiness" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPersonal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="business" name="Business" stroke="#3b82f6" fill="url(#gradBusiness)" strokeWidth={2} />
              <Area type="monotone" dataKey="personal" name="Personal" stroke="#10b981" fill="url(#gradPersonal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Spending by Category Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="text-base lg:text-lg font-semibold text-slate-100 mb-1">By Category</h2>
          <p className="text-slate-500 text-xs lg:text-sm mb-4">Spending distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#1e2433', border: '1px solid #334155', borderRadius: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-slate-400 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="text-slate-300 font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Top Merchants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h2 className="text-base lg:text-lg font-semibold text-slate-100 mb-1">Top Merchants</h2>
          <p className="text-slate-500 text-xs lg:text-sm mb-4">Highest spending this year</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topMerchants} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" horizontal={false} />
              <XAxis type="number" stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <YAxis type="category" dataKey="merchant" stroke="#475569" tick={{ fontSize: 11 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tax Deduction Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base lg:text-lg font-semibold text-slate-100">Deduction Opportunities</h2>
              <p className="text-slate-500 text-xs lg:text-sm">Uncaptured tax savings</p>
            </div>
            {suggestions.length > 0 && (
              <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {suggestions.length} found
              </span>
            )}
          </div>
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <ReceiptRefundIcon className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No suggestions at this time</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {suggestions.slice(0, 5).map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-dark-200 rounded-xl border border-slate-700/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <ReceiptRefundIcon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{s.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.rule}</p>
                  </div>
                  <span className="text-emerald-400 text-sm font-semibold flex-shrink-0">
                    {formatCurrency(s.potential_deduction)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Deductible Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="text-base lg:text-lg font-semibold text-slate-100">Tax Deductible Summary</h2>
            <p className="text-slate-500 text-xs lg:text-sm">Estimated savings at 25% bracket</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl lg:text-2xl font-bold text-purple-400">{formatCurrency((summary.total_deductible || 0) * 0.25)}</p>
            <p className="text-slate-500 text-xs">Estimated savings</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Total Expenses', value: parseFloat(summary.total_amount || 0), color: 'bg-slate-600', max: parseFloat(summary.total_amount || 1) },
            { label: 'Business Expenses', value: parseFloat(summary.business_amount || 0), color: 'bg-brand-500', max: parseFloat(summary.total_amount || 1) },
            { label: 'Tax Deductible', value: parseFloat(summary.total_deductible || 0), color: 'bg-purple-500', max: parseFloat(summary.total_amount || 1) },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">{item.label}</span>
                <span className="text-slate-200 font-medium">{formatCurrency(item.value)}</span>
              </div>
              <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.7 + i * 0.1, ease: 'easeOut' }}
                  className={`h-full ${item.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  CreditCardIcon, BuildingOfficeIcon, UserIcon,
  ReceiptRefundIcon, ArrowPathIcon, ArrowTrendingUpIcon,
  ArrowTrendingDownIcon, ScaleIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { formatCurrency, CHART_COLORS } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';


const INCOME_COLOR  = '#10d9a0'; // teal-green
const EXPENSE_COLOR = '#f43f5e'; // rose-red
const NET_COLOR     = '#818cf8'; // indigo

const IncomeExpenseTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1117] border border-slate-700/60 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="font-medium mb-0.5" style={{ color: p.color, fontFamily: 'inherit' }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
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
    try { await api.post('/plaid/sync'); await fetchData(); }
    catch {} finally { setSyncing(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#10d9a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const summary     = data?.summary       || {};
  const byCategory  = data?.byCategory    || [];
  const monthlyTrend= data?.monthlyTrend  || [];
  const topMerchants= data?.topMerchants  || [];
  const suggestions = data?.suggestions?.suggestions || [];

  const totalIncome  = parseFloat(summary.total_income  || 0);
  const totalExpense = parseFloat(summary.total_amount  || 0);
  const netFlow      = totalIncome - totalExpense;

  // Income vs Expense monthly bars
  const ieData = monthlyTrend.map(m => ({
    month: m.month,
    Income:   parseFloat(m.income  || 0),
    Expenses: parseFloat(m.total   || 0),
    Net:      parseFloat(m.income  || 0) - parseFloat(m.total || 0),
  }));

  const pieData = byCategory
    .filter(c => !c.is_income)
    .slice(0, 6)
    .map(c => ({ name: c.name || 'Uncategorized', value: parseFloat(c.total) }));

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      className="space-y-5 lg:space-y-7 max-w-7xl"
     
    >
      {/* ── Header ── */}
      <motion.div {...fade(0)} className="flex items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl lg:text-2xl font-bold text-slate-100 tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}
          >
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs tracking-widest uppercase">Financial overview · {new Date().getFullYear()}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSync}
          disabled={syncing}
          className="btn-secondary flex items-center gap-2 text-xs whitespace-nowrap"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync Bank'}</span>
        </motion.button>
      </motion.div>

      {/* ── Cash-flow KPIs ── */}
      <motion.div {...fade(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Income',
            value: totalIncome,
            icon: ArrowTrendingUpIcon,
            color: INCOME_COLOR,
            bg: 'rgba(16,217,160,0.08)',
            border: 'rgba(16,217,160,0.2)',
          },
          {
            label: 'Total Expenses',
            value: totalExpense,
            icon: ArrowTrendingDownIcon,
            color: EXPENSE_COLOR,
            bg: 'rgba(244,63,94,0.08)',
            border: 'rgba(244,63,94,0.2)',
          },
          {
            label: 'Net Cash Flow',
            value: Math.abs(netFlow),
            prefix: netFlow >= 0 ? '+' : '−',
            icon: ScaleIcon,
            color: netFlow >= 0 ? INCOME_COLOR : EXPENSE_COLOR,
            bg: netFlow >= 0 ? 'rgba(16,217,160,0.08)' : 'rgba(244,63,94,0.08)',
            border: netFlow >= 0 ? 'rgba(16,217,160,0.2)' : 'rgba(244,63,94,0.2)',
          },
          {
            label: 'Tax Deductible',
            value: parseFloat(summary.total_deductible || 0),
            icon: ReceiptRefundIcon,
            color: NET_COLOR,
            bg: 'rgba(129,140,248,0.08)',
            border: 'rgba(129,140,248,0.2)',
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fade(0.08 + i * 0.05)}
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 tracking-widest uppercase">{kpi.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}>
                <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-xl lg:text-2xl font-semibold text-slate-100 tabular-nums">
              {kpi.prefix || ''}{formatCurrency(kpi.value)}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Income vs Expenses Chart ── */}
      <motion.div {...fade(0.15)} className="card" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-100" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Income vs Expenses</h2>
            <p className="text-slate-500 text-xs mt-0.5 tracking-wide">Monthly cash flow — last 12 months</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: INCOME_COLOR }} />Income
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: EXPENSE_COLOR }} />Expenses
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-0.5 inline-block" style={{ background: NET_COLOR }} />Net
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={ieData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.9} />
                <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.9} />
                <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Inter' }} />
            <YAxis stroke="#334155" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Inter' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<IncomeExpenseTooltip />} />
            <Bar dataKey="Income"   fill="url(#incomeGrad)"  radius={[4,4,0,0]} maxBarSize={32} />
            <Bar dataKey="Expenses" fill="url(#expenseGrad)" radius={[4,4,0,0]} maxBarSize={32} />
            <Line dataKey="Net" type="monotone" stroke={NET_COLOR} strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Row 2: Category Pie + Top Merchants ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fade(0.25)} className="card" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-slate-100 mb-0.5" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Spending by Category</h2>
          <p className="text-slate-500 text-xs mb-4">Expense distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip
                formatter={v => formatCurrency(v)}
                contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            {pieData.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-slate-400 truncate">{item.name}</span>
                </div>
                <span className="text-slate-300 tabular-nums ml-1">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fade(0.3)} className="card" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-slate-100 mb-0.5" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Top Merchants</h2>
          <p className="text-slate-500 text-xs mb-4">Highest spend this year</p>
          <div className="space-y-2.5">
            {topMerchants.slice(0, 6).map((m, i) => {
              const max = parseFloat(topMerchants[0]?.total || 1);
              const pct = Math.min(100, (parseFloat(m.total) / max) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate max-w-[180px]">{m.merchant}</span>
                    <span className="text-slate-400 tabular-nums">{formatCurrency(m.total)}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: EXPENSE_COLOR, opacity: 0.7 + (1 - i / 6) * 0.3 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Row 3: Business Breakdown + Deduction Opportunities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Business vs Personal */}
        <motion.div {...fade(0.35)} className="card" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-slate-100 mb-0.5" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Expense Breakdown</h2>
          <p className="text-slate-500 text-xs mb-5">Business vs personal allocation</p>
          <div className="space-y-4">
            {[
              { label: 'Business', value: parseFloat(summary.business_amount || 0), color: '#3b82f6' },
              { label: 'Personal', value: parseFloat(summary.personal_amount || 0), color: '#10b981' },
              { label: 'Deductible', value: parseFloat(summary.total_deductible || 0), color: NET_COLOR },
            ].map((item) => {
              const pct = totalExpense > 0 ? Math.min(100, (item.value / totalExpense) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-slate-200 tabular-nums">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Tax Deduction Suggestions */}
        <motion.div {...fade(0.4)} className="card" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Deduction Opportunities</h2>
              <p className="text-slate-500 text-xs mt-0.5">Uncaptured tax savings</p>
            </div>
            {suggestions.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(129,140,248,0.12)', color: NET_COLOR, border: '1px solid rgba(129,140,248,0.25)' }}>
                {suggestions.length} found
              </span>
            )}
          </div>
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-slate-600">
              <ReceiptRefundIcon className="w-9 h-9 mb-2 opacity-30" />
              <p className="text-xs">No suggestions at this time</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {suggestions.slice(0, 5).map((s, i) => (
                <motion.div
                  key={i}
                  {...fade(0.4 + i * 0.04)}
                  className="flex items-start gap-3 p-2.5 rounded-xl"
                  style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 font-medium truncate">{s.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.rule}</p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{ color: INCOME_COLOR }}>
                    {formatCurrency(s.potential_deduction)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Line, Legend,
} from 'recharts';
import {
  DocumentArrowDownIcon, SparklesIcon, ReceiptRefundIcon,
  CurrencyDollarIcon, ScaleIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { formatCurrency, CHART_COLORS } from '@/lib/utils';
import { previewTaxReportPDF } from '@/lib/exportPdf';
import PDFPreviewModal from '@/components/reports/PDFPreviewModal';


const TEAL   = '#10d9a0';
const ROSE   = '#f43f5e';
const INDIGO = '#818cf8';
const AMBER  = '#fbbf24';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} className="p-3 shadow-2xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="font-medium mb-0.5" style={{ color: p.color, fontFamily: 'inherit' }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear]           = useState(currentYear);
  const [taxData, setTaxData]     = useState(null);
  const [reportData, setReportData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [exporting, setExporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl]       = useState(null);

  const handlePreviewPDF = async () => {
    setExporting(true);
    try {
      const url = previewTaxReportPDF(taxData, reportData, year);
      setPdfUrl(url);
      setPreviewOpen(true);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [taxRes, reportRes, suggestRes] = await Promise.all([
          api.get(`/reports/tax?year=${year}`),
          api.get(`/reports/summary?date_from=${year}-01-01&date_to=${year}-12-31`),
          api.get('/reports/deduction-suggestions'),
        ]);
        setTaxData(taxRes.data);
        setReportData(reportRes.data);
        setSuggestions(suggestRes.data.suggestions || []);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [year]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${TEAL} transparent ${TEAL} ${TEAL}` }} />
      </div>
    );
  }

  const monthlyData    = reportData?.monthlyTrend || [];
  const categoryData   = reportData?.byCategory?.filter(c => c.category_type !== 'personal').slice(0, 8) || [];
  const deductionRate  = taxData?.totalExpenses ? ((taxData.totalDeductible / taxData.totalExpenses) * 100).toFixed(1) : '0.0';

  const chartData = monthlyData.map(m => ({
    month: m.month?.slice(5),
    Total:      parseFloat(m.total      || 0),
    Deductible: parseFloat(m.deductible || 0),
  }));

  const kpis = [
    {
      label: 'Total Expenses',
      value: formatCurrency(taxData?.totalExpenses || 0),
      sub: `FY ${year}`,
      icon: ChartBarIcon,
      color: ROSE,
      bg: 'rgba(244,63,94,0.08)',
      border: 'rgba(244,63,94,0.2)',
    },
    {
      label: 'Total Deductible',
      value: formatCurrency(taxData?.totalDeductible || 0),
      sub: `${taxData?.deductibleExpenses || 0} items`,
      icon: ReceiptRefundIcon,
      color: INDIGO,
      bg: 'rgba(129,140,248,0.08)',
      border: 'rgba(129,140,248,0.2)',
    },
    {
      label: 'Est. Tax Savings',
      value: formatCurrency(taxData?.estimatedTaxSavings || 0),
      sub: '25% bracket',
      icon: SparklesIcon,
      color: TEAL,
      bg: 'rgba(16,217,160,0.08)',
      border: 'rgba(16,217,160,0.2)',
    },
    {
      label: 'Deduction Rate',
      value: `${deductionRate}%`,
      sub: 'of total expenses',
      icon: ScaleIcon,
      color: AMBER,
      bg: 'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.2)',
    },
  ];

  return (
    <div className="space-y-5 lg:space-y-7 max-w-7xl">

      {/* ── Header ── */}
      <motion.div {...fade(0)} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-100 tracking-tight" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>
            Reports & Tax
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs tracking-widest uppercase">Tax year analysis · {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="input w-auto text-xs"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit' }}
          >
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handlePreviewPDF}
            disabled={exporting || loading}
            className="btn-secondary flex items-center gap-2 text-xs disabled:opacity-50"
          >
            {exporting
              ? <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              : <DocumentArrowDownIcon className="w-3.5 h-3.5" />
            }
            <span className="hidden sm:inline">{exporting ? 'Generating…' : 'Export PDF'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div {...fade(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
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
              {kpi.value}
            </p>
            <p className="text-xs text-slate-500">{kpi.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Monthly Deductibles Chart ── */}
      <motion.div {...fade(0.15)} className="card" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-100" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Monthly Deductibles</h2>
            <p className="text-slate-500 text-xs mt-0.5 tracking-wide">Total vs deductible spend by month</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(255,255,255,0.12)' }} />Total
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: INDIGO }} />Deductible
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
              </linearGradient>
              <linearGradient id="dedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INDIGO} stopOpacity={0.9} />
                <stop offset="100%" stopColor={INDIGO} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Inter' }} />
            <YAxis stroke="#334155" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Inter' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="Total"      fill="url(#totalGrad)" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="Deductible" fill="url(#dedGrad)"   radius={[4,4,0,0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Business Categories + Deduction Suggestions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Business Category Breakdown */}
        <motion.div {...fade(0.25)} className="card" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-slate-100 mb-0.5" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Business Categories</h2>
          <p className="text-slate-500 text-xs mb-5">Deductible expense distribution</p>
          <div className="space-y-3">
            {categoryData.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-8">No business expenses recorded</p>
            ) : categoryData.map((c, i) => {
              const maxVal = parseFloat(categoryData[0]?.total || 1);
              const pct = Math.min(100, (parseFloat(c.total) / maxVal) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-slate-300 truncate">{c.name || 'Uncategorized'}</span>
                    </div>
                    <span className="text-slate-200 tabular-nums ml-2">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Deduction Suggestions */}
        <motion.div {...fade(0.3)} className="card" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Deduction Opportunities</h2>
              <p className="text-slate-500 text-xs mt-0.5">Uncaptured tax savings</p>
            </div>
            {suggestions.length > 0 && (
              <div className="text-right">
                <p className="tabular-nums text-sm font-semibold" style={{ color: TEAL, fontFamily: 'inherit' }}>
                  {formatCurrency(suggestions.reduce((acc, s) => acc + s.potential_deduction, 0))}
                </p>
                <p className="text-slate-500 text-xs">potential savings</p>
              </div>
            )}
          </div>
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-slate-600">
              <ReceiptRefundIcon className="w-9 h-9 mb-2 opacity-30" />
              <p className="text-xs">No suggestions at this time</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  {...fade(0.3 + i * 0.04)}
                  className="flex items-start gap-3 p-2.5 rounded-xl"
                  style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.14)' }}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(251,191,36,0.12)' }}>
                    <SparklesIcon className="w-3.5 h-3.5" style={{ color: AMBER }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 font-medium truncate">{s.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.rule}</p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{ color: TEAL, fontFamily: 'inherit' }}>
                    {formatCurrency(s.potential_deduction)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Applicable Tax Rules ── */}
      <motion.div {...fade(0.4)} className="card" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-semibold text-slate-100 mb-0.5" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Applicable Deduction Rules</h2>
        <p className="text-slate-500 text-xs mb-5">IRS-based rules applied to your expenses</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(taxData?.applicableRules || []).map((rule, i) => (
            <motion.div
              key={i}
              {...fade(0.4 + i * 0.03)}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.14)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)' }}
              >
                <span className="text-xs font-bold tabular-nums" style={{ color: INDIGO, fontFamily: 'inherit' }}>{rule.percentage}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{rule.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{rule.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <PDFPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        pdfUrl={pdfUrl}
        taxData={taxData}
        reportData={reportData}
        year={year}
      />
    </div>
  );
}

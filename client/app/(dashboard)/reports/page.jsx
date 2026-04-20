'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { DocumentArrowDownIcon, SparklesIcon, ReceiptRefundIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { formatCurrency, CHART_COLORS } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import { previewTaxReportPDF } from '@/lib/exportPdf';
import PDFPreviewModal from '@/components/reports/PDFPreviewModal';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-100 border border-slate-700 rounded-xl p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [taxData, setTaxData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

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
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monthlyData = reportData?.monthlyTrend || [];
  const categoryData = reportData?.byCategory?.filter(c => c.category_type !== 'personal').slice(0, 8) || [];

  return (
    <div className="max-w-7xl space-y-5 lg:space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-100">Reports & Tax</h1>
          <p className="text-slate-400 mt-1 text-sm">Tax year {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input w-auto text-sm">
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePreviewPDF}
            disabled={exporting || loading}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {exporting
              ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              : <DocumentArrowDownIcon className="w-4 h-4" />
            }
            <span className="hidden sm:inline">{exporting ? 'Generating...' : 'Export PDF'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Tax KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard index={0} title="Total Expenses" value={formatCurrency(taxData?.totalExpenses || 0)} subtitle={`FY ${year}`} color="brand" />
        <StatCard index={1} title="Total Deductible" value={formatCurrency(taxData?.totalDeductible || 0)} subtitle={`${taxData?.deductibleExpenses || 0} items`} color="purple" />
        <StatCard
          index={2}
          title="Est. Tax Savings"
          value={formatCurrency(taxData?.estimatedTaxSavings || 0)}
          subtitle="At 25% tax bracket"
          icon={SparklesIcon}
          color="green"
        />
        <StatCard
          index={3}
          title="Deduction Rate"
          value={taxData?.totalExpenses ? `${((taxData.totalDeductible / taxData.totalExpenses) * 100).toFixed(1)}%` : '0%'}
          subtitle="Of total expenses"
          color="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Monthly Deductibles */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Monthly Deductibles</h2>
          <p className="text-slate-500 text-sm mb-4">Deductible vs total by month</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="total" name="Total" fill="#334155" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deductible" name="Deductible" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Business Category Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Business Categories</h2>
          <p className="text-slate-500 text-sm mb-4">Deductible expense breakdown</p>
          <div className="space-y-3">
            {categoryData.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No business expenses recorded</p>
            ) : categoryData.map((c, i) => {
              const maxVal = categoryData[0]?.total || 1;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-slate-300">{c.name || 'Uncategorized'}</span>
                    </div>
                    <span className="text-slate-200 font-medium">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="h-1.5 bg-dark-300 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.total / maxVal) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Deduction Suggestions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Deduction Opportunities</h2>
            <p className="text-slate-500 text-sm">Expenses that may qualify for deductions</p>
          </div>
          {suggestions.length > 0 && (
            <div className="text-right">
              <p className="text-emerald-400 font-bold text-lg">
                {formatCurrency(suggestions.reduce((acc, s) => acc + s.potential_deduction, 0))}
              </p>
              <p className="text-slate-500 text-xs">Potential savings</p>
            </div>
          )}
        </div>

        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <ReceiptRefundIcon className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No deduction opportunities found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                className="flex items-center gap-4 p-4 bg-dark-200 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{s.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.rule}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{s.rule_description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-slate-400">{formatCurrency(s.amount)}</p>
                  <p className="text-emerald-400 font-semibold text-sm">→ {formatCurrency(s.potential_deduction)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Applicable Tax Rules */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Applicable Deduction Rules</h2>
        <p className="text-slate-500 text-sm mb-6">IRS-based rules applied to your expenses</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(taxData?.applicableRules || []).map((rule, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.03 }}
              className="flex items-start gap-3 p-3 bg-dark-200 rounded-xl border border-slate-700/50"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 text-xs font-bold">{rule.percentage}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{rule.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
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

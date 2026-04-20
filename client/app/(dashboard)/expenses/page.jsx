'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, MagnifyingGlassIcon, FunnelIcon,
  PencilSquareIcon, TrashIcon, SparklesIcon, CreditCardIcon,
} from '@heroicons/react/24/outline';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency, formatDate, TYPE_LABELS } from '@/lib/utils';
import ExpenseModal from '@/components/expenses/ExpenseModal';

export default function ExpensesPage() {
  const { expenses, categories, loading, total, fetchExpenses, fetchCategories, deleteExpense } = useExpenses();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type: '', category_id: '', is_deductible: '', search: '', limit: 50, offset: 0 });

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchExpenses(filters); }, [filters]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));

  const handleDelete = async (id, description) => {
    if (!confirm(`Delete "${description}"?`)) return;
    await deleteExpense(id);
  };

  const handleEdit = (expense) => { setEditingExpense(expense); setModalOpen(true); };
  const handleAdd = () => { setEditingExpense(null); setModalOpen(true); };
  const handleModalClose = () => { setModalOpen(false); setEditingExpense(null); fetchExpenses(filters); };

  return (
    <div className="max-w-7xl space-y-4 lg:space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-100">Expenses</h1>
          <p className="text-slate-400 mt-0.5 text-sm">{total} transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 text-sm ${showFilters ? 'border-brand-500/50 text-brand-400' : ''}`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm">
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="input pl-9"
          />
        </div>
      </motion.div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)} className="input text-sm">
                <option value="">All Types</option>
                <option value="business">Business</option>
                <option value="personal">Personal</option>
                <option value="mixed">Mixed</option>
              </select>
              <select value={filters.category_id} onChange={e => handleFilterChange('category_id', e.target.value)} className="input text-sm">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={filters.is_deductible} onChange={e => handleFilterChange('is_deductible', e.target.value)} className="input text-sm">
                <option value="">All</option>
                <option value="true">Deductible</option>
                <option value="false">Non-Deductible</option>
              </select>
              <input type="date" value={filters.date_from || ''} onChange={e => handleFilterChange('date_from', e.target.value)} className="input text-sm" />
              <input type="date" value={filters.date_to || ''} onChange={e => handleFilterChange('date_to', e.target.value)} className="input text-sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-slate-500">
          <CreditCardIcon className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">No expenses found</p>
          <p className="text-sm mt-1">Add your first expense or adjust filters</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden md:block card p-0 overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 uppercase tracking-wider">Date</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 uppercase tracking-wider">Description</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 uppercase tracking-wider hidden lg:table-cell">Category</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 uppercase tracking-wider">Type</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-5 py-3 uppercase tracking-wider">Amount</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-5 py-3 uppercase tracking-wider hidden lg:table-cell">Deductible</th>
                  <th className="px-5 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {expenses.map((expense, i) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors group"
                    >
                      <td className="px-5 py-3.5 text-sm text-slate-400 whitespace-nowrap">{formatDate(expense.date, 'MMM d')}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-200 font-medium">{expense.description}</p>
                        {expense.merchant_name && <p className="text-xs text-slate-500">{expense.merchant_name}</p>}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {expense.category_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: expense.category_color || '#6b7280' }} />
                            <span className="text-sm text-slate-300">{expense.category_name}</span>
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge badge-${expense.type}`}>{TYPE_LABELS[expense.type]}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-slate-100 font-semibold text-sm">{formatCurrency(expense.amount)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                        {expense.is_deductible ? (
                          <span className="badge badge-deductible flex items-center gap-1 justify-end">
                            <SparklesIcon className="w-3 h-3" />
                            {formatCurrency(expense.deductible_amount)}
                          </span>
                        ) : <span className="text-slate-600 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleEdit(expense)}
                            className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-all">
                            <PencilSquareIcon className="w-4 h-4" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(expense.id, expense.description)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <TrashIcon className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            <AnimatePresence>
              {expenses.map((expense, i) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{expense.description}</p>
                      {expense.merchant_name && <p className="text-xs text-slate-500 mt-0.5">{expense.merchant_name}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`badge badge-${expense.type}`}>{TYPE_LABELS[expense.type]}</span>
                        {expense.category_name && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: expense.category_color || '#6b7280' }} />
                            <span className="text-xs text-slate-400">{expense.category_name}</span>
                          </div>
                        )}
                        <span className="text-xs text-slate-500">{formatDate(expense.date, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-slate-100">{formatCurrency(expense.amount)}</p>
                      {expense.is_deductible && (
                        <span className="badge badge-deductible text-xs flex items-center gap-1 mt-1 justify-end">
                          <SparklesIcon className="w-3 h-3" />
                          {formatCurrency(expense.deductible_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleEdit(expense)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-all text-xs font-medium">
                      <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleDelete(expense.id, expense.description)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-xs font-medium">
                      <TrashIcon className="w-3.5 h-3.5" /> Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Pagination */}
      {total > filters.limit && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-400">
            {filters.offset + 1}–{Math.min(filters.offset + filters.limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button disabled={filters.offset === 0}
              onClick={() => handleFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">← Prev</button>
            <button disabled={filters.offset + filters.limit >= total}
              onClick={() => handleFilterChange('offset', filters.offset + filters.limit)}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      <ExpenseModal isOpen={modalOpen} onClose={handleModalClose} expense={editingExpense} />
    </div>
  );
}

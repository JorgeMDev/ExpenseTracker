'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ExpenseModal({ isOpen, onClose, expense = null }) {
  const { categories, createExpense, updateExpense, analyzeExpense } = useExpenses();
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: expense ? {
      date: expense.date?.split('T')[0],
      amount: expense.amount,
      description: expense.description,
      merchant_name: expense.merchant_name || '',
      type: expense.type,
      category_id: expense.category_id || '',
      notes: expense.notes || '',
    } : {
      date: new Date().toISOString().split('T')[0],
      type: 'personal',
    },
  });

  const watchedType = watch('type');
  const watchedDescription = watch('description');
  const watchedAmount = watch('amount');

  useEffect(() => {
    if (expense) {
      reset({
        date: expense.date?.split('T')[0],
        amount: expense.amount,
        description: expense.description,
        merchant_name: expense.merchant_name || '',
        type: expense.type,
        category_id: expense.category_id || '',
        notes: expense.notes || '',
      });
    } else {
      reset({ date: new Date().toISOString().split('T')[0], type: 'personal' });
    }
    setAiSuggestion(null);
  }, [expense, isOpen]);

  const handleAnalyze = async () => {
    if (!watchedDescription || !watchedAmount) return;
    setAnalyzing(true);
    try {
      const result = await analyzeExpense({
        description: watchedDescription,
        amount: parseFloat(watchedAmount),
        type: watchedType,
      });
      setAiSuggestion(result);
      if (result.is_deductible) {
        toast.success('Tax deduction opportunity found!');
      }
    } catch {} finally {
      setAnalyzing(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setValue('type', aiSuggestion.type);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        category_id: data.category_id || null,
      };
      if (expense) {
        await updateExpense(expense.id, payload);
      } else {
        await createExpense(payload);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <Dialog.Panel className="bg-dark-100 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <Dialog.Title className="text-lg font-semibold text-slate-100">
                    {expense ? 'Edit Expense' : 'Add Expense'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                  {/* Date & Amount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Date</label>
                      <input {...register('date', { required: 'Required' })} type="date" className="input" />
                      {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
                    </div>
                    <div>
                      <label className="label">Amount ($)</label>
                      <input {...register('amount', { required: 'Required', min: { value: 0.01, message: 'Must be > 0' } })}
                        type="number" step="0.01" className="input" placeholder="0.00" />
                      {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">Description</label>
                    <input {...register('description', { required: 'Required' })} type="text" className="input"
                      placeholder="e.g. Client lunch at Nobu" />
                    {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                  </div>

                  {/* Merchant */}
                  <div>
                    <label className="label">Merchant (optional)</label>
                    <input {...register('merchant_name')} type="text" className="input" placeholder="e.g. Starbucks" />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="label">Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['personal', 'business', 'mixed'].map(t => (
                        <label key={t} className="cursor-pointer">
                          <input {...register('type')} type="radio" value={t} className="sr-only" />
                          <div className={`text-center py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                            watchedType === t
                              ? t === 'business' ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                                : t === 'personal' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-dark-200 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="label">Category</label>
                    <select {...register('category_id')} className="input">
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label">Notes (optional)</label>
                    <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Additional details..." />
                  </div>

                  {/* AI Analyze Button */}
                  <motion.button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing || !watchedDescription}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 transition-all text-sm font-medium disabled:opacity-50"
                  >
                    <SparklesIcon className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
                    {analyzing ? 'Analyzing...' : 'Analyze Tax Deductions'}
                  </motion.button>

                  {/* AI Suggestion Result */}
                  <AnimatePresence>
                    {aiSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-xl border ${
                          aiSuggestion.is_deductible
                            ? 'bg-purple-500/5 border-purple-500/30'
                            : 'bg-slate-700/20 border-slate-700'
                        }`}
                      >
                        {aiSuggestion.is_deductible ? (
                          <>
                            <p className="text-purple-300 text-sm font-semibold flex items-center gap-2">
                              <SparklesIcon className="w-4 h-4" /> Tax deductible!
                            </p>
                            <p className="text-slate-300 text-sm mt-1">
                              {aiSuggestion.deductible_percentage}% deductible →{' '}
                              <span className="text-emerald-400 font-medium">
                                {formatCurrency(aiSuggestion.deductible_amount)} savings
                              </span>
                            </p>
                            {aiSuggestion.deduction_rule && (
                              <p className="text-slate-500 text-xs mt-1">Rule: {aiSuggestion.deduction_rule.replace(/_/g, ' ')}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-400 text-sm">No deduction applicable for this expense type.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                    <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : expense ? 'Save Changes' : 'Add Expense'}
                    </motion.button>
                  </div>
                </form>
              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

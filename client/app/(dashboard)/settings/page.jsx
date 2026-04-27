'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useExpenses } from '@/context/ExpenseContext';
import { BanknotesIcon, PlusIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { categories, fetchCategories } = useExpenses();
  const [savingProfile, setSavingProfile] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'business', color: '#3b82f6' });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name, currency: user?.currency || 'USD' },
  });

  const onSaveProfile = async (data) => {
    setSavingProfile(true);
    try { await updateProfile(data); }
    finally { setSavingProfile(false); }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    try {
      await api.post('/categories', newCategory);
      await fetchCategories();
      setNewCategory({ name: '', type: 'business', color: '#3b82f6' });
      toast.success('Category added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const customCategories = categories.filter(c => !c.is_default);

  return (
    <div className="max-w-2xl space-y-5 lg:space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-100 tracking-tight" style={{ fontFamily: "'Cormorant Garamond', sans-serif" }}>Settings</h1>
        <p className="text-slate-500 mt-0.5 text-xs tracking-widest uppercase">Account & preferences</p>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <h2 className="text-lg font-semibold text-slate-100 mb-5">Profile</h2>
        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input {...register('name', { required: 'Name is required' })} type="text" className="input" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email || ''} disabled type="email" className="input opacity-50 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">Currency</label>
            <select {...register('currency')} className="input">
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="MXN">MXN — Mexican Peso</option>
            </select>
          </div>
          <motion.button type="submit" disabled={savingProfile} whileTap={{ scale: 0.97 }} className="btn-primary flex items-center gap-2">
            {savingProfile ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
          </motion.button>
        </form>
      </motion.div>

      {/* Custom Categories */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Custom Categories</h2>
        <p className="text-slate-500 text-sm mb-5">Add categories specific to your business</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Category name"
            value={newCategory.name}
            onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))}
            className="input flex-1 min-w-36"
          />
          <select value={newCategory.type} onChange={e => setNewCategory(p => ({ ...p, type: e.target.value }))} className="input w-auto">
            <option value="business">Business</option>
            <option value="personal">Personal</option>
            <option value="mixed">Mixed</option>
          </select>
          <input type="color" value={newCategory.color} onChange={e => setNewCategory(p => ({ ...p, color: e.target.value }))}
            className="w-10 h-10 rounded-xl border border-slate-700 bg-dark-200 cursor-pointer" />
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddCategory} className="btn-primary px-3">
            <PlusIcon className="w-4 h-4" />
          </motion.button>
        </div>

        {customCategories.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No custom categories yet</p>
        ) : (
          <div className="space-y-2">
            {customCategories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-dark-200 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: c.color || '#6b7280' }} />
                  <span className="text-sm text-slate-200">{c.name}</span>
                  <span className={`badge badge-${c.type}`}>{c.type}</span>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteCategory(c.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                  <TrashIcon className="w-4 h-4" />
                </motion.button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Bank Connection */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Bank Connection</h2>
        <p className="text-slate-500 text-sm mb-5">Connect your bank account via Plaid for automatic transaction sync</p>
        <motion.button whileTap={{ scale: 0.97 }} className="btn-secondary flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Connect Bank Account
        </motion.button>
        <p className="text-slate-600 text-xs mt-3">Powered by Plaid. Bank-level 256-bit encryption.</p>
      </motion.div>
    </div>
  );
}

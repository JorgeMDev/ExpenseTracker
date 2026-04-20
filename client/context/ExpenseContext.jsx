'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const ExpenseContext = createContext(null);

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchExpenses = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v !== undefined && v !== '' && params.append(k, v));
      const { data } = await api.get(`/expenses?${params}`);
      setExpenses(data.expenses);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch {}
  }, []);

  const createExpense = useCallback(async (expenseData) => {
    const { data } = await api.post('/expenses', expenseData);
    setExpenses(prev => [data.expense, ...prev]);
    toast.success('Expense added');
    return data.expense;
  }, []);

  const updateExpense = useCallback(async (id, updates) => {
    const { data } = await api.patch(`/expenses/${id}`, updates);
    setExpenses(prev => prev.map(e => e.id === id ? data.expense : e));
    toast.success('Expense updated');
    return data.expense;
  }, []);

  const deleteExpense = useCallback(async (id) => {
    await api.delete(`/expenses/${id}`);
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Expense deleted');
  }, []);

  const fetchSummary = useCallback(async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    const { data } = await api.get(`/expenses/summary?${params}`);
    setSummary(data.summary);
    return data.summary;
  }, []);

  const analyzeExpense = useCallback(async (expenseData) => {
    const { data } = await api.post('/expenses/analyze', expenseData);
    return data.suggestion;
  }, []);

  return (
    <ExpenseContext.Provider value={{
      expenses, categories, summary, loading, total,
      fetchExpenses, fetchCategories, createExpense, updateExpense, deleteExpense,
      fetchSummary, analyzeExpense,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export const useExpenses = () => {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used inside ExpenseProvider');
  return ctx;
};

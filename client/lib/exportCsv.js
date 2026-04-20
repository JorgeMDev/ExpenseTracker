import { formatDate } from './utils';

export function exportTransactionsCSV(expenses, filename = 'transactions.csv') {
  const headers = [
    'Date', 'Description', 'Merchant', 'Category', 'Type',
    'Amount', 'Currency', 'Deductible', 'Deductible %', 'Deductible Amount',
    'Deduction Rule', 'Source', 'Notes',
  ];

  const rows = expenses.map(e => [
    formatDate(e.date, 'yyyy-MM-dd'),
    `"${(e.description || '').replace(/"/g, '""')}"`,
    `"${(e.merchant_name || '').replace(/"/g, '""')}"`,
    `"${(e.category_name || '').replace(/"/g, '""')}"`,
    e.type,
    e.amount,
    e.currency || 'USD',
    e.is_deductible ? 'Yes' : 'No',
    e.deductible_percentage || 0,
    e.deductible_amount || 0,
    e.deduction_rule || '',
    e.source || 'manual',
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

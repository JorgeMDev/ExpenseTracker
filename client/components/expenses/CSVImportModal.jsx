'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon, ArrowUpTrayIcon, CheckCircleIcon,
  DocumentTextIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useExpenses } from '@/context/ExpenseContext';
import { parseCSV } from '@/lib/csvParser';
import { formatCurrency, formatDate } from '@/lib/utils';

const BANK_OPTIONS = [
  { value: 'chase',      label: 'Chase',           hint: 'Date, Description, Amount' },
  { value: 'bofa',       label: 'Bank of America',  hint: 'Date, Description, Amount' },
  { value: 'wellsfargo', label: 'Wells Fargo',      hint: 'Date, Amount, ..., Description' },
  { value: 'citi',       label: 'Citi',             hint: 'Status, Date, Description, Debit, Credit' },
  { value: 'generic',    label: 'Generic / Other',  hint: 'Auto-detect columns' },
];

const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
};

export default function CSVImportModal({ isOpen, onClose }) {
  const { importCSV, parsePDF } = useExpenses();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [bankFormat, setBankFormat] = useState('chase');
  const [fileType, setFileType] = useState(null); // 'csv' | 'pdf'
  const [transactions, setTransactions] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStep(1);
    setBankFormat('chase');
    setFileType(null);
    setTransactions([]);
    setParseError(null);
    setParsing(false);
    setImporting(false);
    setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const processFile = async (file) => {
    if (!file) return;

    const isPDF = file.name.endsWith('.pdf');
    const isCSV = file.name.endsWith('.csv');

    if (!isPDF && !isCSV) {
      setParseError('Please select a .csv or .pdf file.');
      return;
    }

    setParseError(null);
    setFileType(isPDF ? 'pdf' : 'csv');

    if (isPDF) {
      setParsing(true);
      try {
        const parsed = await parsePDF(file);
        setTransactions(parsed);
        setStep(2);
      } catch (err) {
        setParseError(err?.response?.data?.message || err.message || 'Failed to parse PDF.');
      } finally {
        setParsing(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = parseCSV(e.target.result, bankFormat);
          setTransactions(parsed);
          setStep(2);
        } catch (err) {
          setParseError(err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e) => processFile(e.target.files?.[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const toggleRow = (i) => setTransactions(prev =>
    prev.map((tx, idx) => idx === i ? { ...tx, _selected: !tx._selected } : tx)
  );

  const toggleAll = (val) => setTransactions(prev => prev.map(tx => ({ ...tx, _selected: val })));

  const selectedCount = transactions.filter(t => t._selected).length;
  const allSelected = selectedCount === transactions.length && transactions.length > 0;

  const handleImport = async () => {
    const selected = transactions.filter(t => t._selected).map(({ _selected, ...tx }) => tx);
    if (selected.length === 0) return;
    setImporting(true);
    try {
      const res = await importCSV(selected);
      setResult(res);
      setStep(3);
    } catch {
      setParseError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl"
            >
              <Dialog.Panel className="bg-dark-100 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Dialog.Title className="text-base font-semibold text-slate-100">
                      Import Bank Statement
                    </Dialog.Title>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map(s => (
                        <div key={s} className={`w-1.5 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-brand-500' : 'bg-slate-600'}`} />
                      ))}
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {/* Step 1 — Upload */}
                    {step === 1 && (
                      <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="p-5 space-y-5">
                        <p className="text-sm text-slate-400">
                          Upload a CSV export or a Bank of America PDF statement to import transactions.
                        </p>

                        {/* Bank format selector — only relevant for CSV */}
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                            Bank Format <span className="normal-case text-slate-500">(for CSV files)</span>
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {BANK_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => setBankFormat(opt.value)}
                                className={`text-left p-3 rounded-xl border transition-all ${
                                  bankFormat === opt.value
                                    ? 'border-brand-500/60 bg-brand-500/10 text-slate-100'
                                    : 'border-slate-700/50 bg-dark-200 text-slate-300 hover:border-slate-600'
                                }`}
                              >
                                <p className="text-sm font-medium">{opt.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{opt.hint}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* File drop zone */}
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Upload File</p>
                          <label
                            className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                              dragOver ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 hover:border-slate-600 bg-dark-200'
                            } ${parsing ? 'opacity-60 pointer-events-none' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".csv,.pdf"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            {parsing ? (
                              <>
                                <div className="w-8 h-8 border-2 border-brand-500/40 border-t-brand-400 rounded-full animate-spin" />
                                <p className="text-sm text-slate-400">Parsing PDF…</p>
                              </>
                            ) : (
                              <>
                                <ArrowUpTrayIcon className={`w-8 h-8 transition-colors ${dragOver ? 'text-brand-400' : 'text-slate-500'}`} />
                                <div className="text-center">
                                  <p className="text-sm text-slate-300 font-medium">Drop your file here or click to browse</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Accepts <span className="text-slate-400">.csv</span> from any bank · <span className="text-slate-400">.pdf</span> from Bank of America
                                  </p>
                                </div>
                              </>
                            )}
                          </label>
                        </div>

                        {parseError && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-300">{parseError}</p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Step 2 — Preview */}
                    {step === 2 && (
                      <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col">
                        <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
                          <p className="text-sm text-slate-400">
                            <span className="text-slate-100 font-semibold">{selectedCount}</span> of{' '}
                            <span className="text-slate-100 font-semibold">{transactions.length}</span> transactions selected
                          </p>
                          {fileType === 'pdf' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30">
                              BofA PDF · withdrawals pre-selected
                            </span>
                          )}
                        </div>

                        <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
                          <table className="w-full">
                            <thead className="sticky top-0 bg-dark-100 z-10">
                              <tr className="border-b border-slate-700/50">
                                <th className="px-5 py-2.5 w-10">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={e => toggleAll(e.target.checked)}
                                    className="rounded border-slate-600 bg-dark-200 text-brand-500 cursor-pointer"
                                  />
                                </th>
                                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2.5 uppercase tracking-wider">Date</th>
                                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2.5 uppercase tracking-wider">Description</th>
                                <th className="text-right text-xs font-medium text-slate-400 px-5 py-2.5 uppercase tracking-wider">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map((tx, i) => (
                                <tr
                                  key={i}
                                  onClick={() => toggleRow(i)}
                                  className={`border-b border-slate-700/20 cursor-pointer transition-colors ${tx._selected ? 'hover:bg-slate-700/20' : 'opacity-40 hover:opacity-60'}`}
                                >
                                  <td className="px-5 py-2.5" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={tx._selected}
                                      onChange={() => toggleRow(i)}
                                      className="rounded border-slate-600 bg-dark-200 text-brand-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-sm text-slate-400 whitespace-nowrap">{formatDate(tx.date, 'MMM d, yyyy')}</td>
                                  <td className="px-3 py-2.5 text-sm text-slate-200 max-w-xs">
                                    <p className="truncate" title={tx.description}>{tx.description}</p>
                                  </td>
                                  <td className="px-5 py-2.5 text-right text-sm font-semibold text-slate-100 whitespace-nowrap">
                                    {formatCurrency(tx.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {parseError && (
                          <div className="px-5 py-3">
                            <p className="text-sm text-red-400">{parseError}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Step 3 — Result */}
                    {step === 3 && (
                      <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="p-8 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-emerald-400">{result?.imported} imported</p>
                          <p className="text-sm text-slate-400 mt-1">
                            {result?.skipped > 0 ? `${result.skipped} skipped (already in your account)` : 'No duplicates found'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-center px-4 py-3 bg-dark-200 rounded-xl border border-slate-700/50">
                            <p className="text-lg font-bold text-slate-100">{result?.total}</p>
                            <p className="text-xs text-slate-500">Total processed</p>
                          </div>
                          <div className="text-center px-4 py-3 bg-dark-200 rounded-xl border border-slate-700/50">
                            <p className="text-lg font-bold text-emerald-400">{result?.imported}</p>
                            <p className="text-xs text-slate-500">New expenses</p>
                          </div>
                          {result?.skipped > 0 && (
                            <div className="text-center px-4 py-3 bg-dark-200 rounded-xl border border-slate-700/50">
                              <p className="text-lg font-bold text-slate-400">{result?.skipped}</p>
                              <p className="text-xs text-slate-500">Duplicates</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-700/50 flex items-center justify-between flex-shrink-0">
                  {step === 1 && (
                    <>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        CSV from any bank · PDF from Bank of America
                      </p>
                      <button onClick={handleClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <button onClick={() => { setStep(1); setParseError(null); }} className="btn-secondary text-sm px-4 py-2">← Back</button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleImport}
                        disabled={selectedCount === 0 || importing}
                        className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40"
                      >
                        {importing
                          ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Importing...</>
                          : <>Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}</>
                        }
                      </motion.button>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <button onClick={() => { reset(); }} className="btn-secondary text-sm px-4 py-2">Import Another</button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose} className="btn-primary text-sm px-4 py-2">Done</motion.button>
                    </>
                  )}
                </div>

              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

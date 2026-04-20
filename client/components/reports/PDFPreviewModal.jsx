'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { exportTaxReportPDF } from '@/lib/exportPdf';

export default function PDFPreviewModal({ isOpen, onClose, pdfUrl, taxData, reportData, year }) {
  const handleDownload = () => {
    exportTaxReportPDF(taxData, reportData, year);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-3xl"
            >
              <Dialog.Panel className="bg-dark-100 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
                  <div>
                    <Dialog.Title className="text-base font-semibold text-slate-100">
                      PDF Preview — Tax Report {year}
                    </Dialog.Title>
                    <p className="text-xs text-slate-500 mt-0.5">Review before downloading</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleDownload}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      Download PDF
                    </motion.button>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* PDF iframe */}
                <div className="flex-1 overflow-hidden bg-slate-900 min-h-[60vh]">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full min-h-[60vh]"
                      title="PDF Preview"
                      style={{ border: 'none' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between flex-shrink-0">
                  <p className="text-xs text-slate-500">tax-report-{year}.pdf</p>
                  <button onClick={onClose} className="btn-secondary text-sm px-3 py-1.5">
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

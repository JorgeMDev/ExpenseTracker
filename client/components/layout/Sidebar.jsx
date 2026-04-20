'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  ChartBarIcon, CreditCardIcon, DocumentChartBarIcon,
  Cog6ToothIcon, ArrowRightOnRectangleIcon, BanknotesIcon,
  Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline';

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { href: '/expenses', label: 'Expenses', icon: CreditCardIcon },
  { href: '/reports', label: 'Reports & Tax', icon: DocumentChartBarIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

function NavLinks({ onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} onClick={onClose}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
                {active && (
                  <motion.div layoutId="activeIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200 text-sm"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          Sign out
        </motion.button>
      </div>
    </>
  );
}

// Desktop sidebar
export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex w-64 bg-dark-200 border-r border-slate-700/50 flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <BanknotesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-100 text-sm">ExpenseTracker</p>
            <p className="text-xs text-slate-500">Smart Finance</p>
          </div>
        </Link>
      </div>
      <NavLinks />
    </aside>
  );
}

// Mobile top header + drawer
export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-200 border-b border-slate-700/50 flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
            <BanknotesIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-100 text-sm">ExpenseTracker</span>
        </Link>
        <button onClick={() => setOpen(true)} className="p-2 text-slate-400 hover:text-slate-200">
          <Bars3Icon className="w-5 h-5" />
        </button>
      </header>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-dark-200 z-50 flex flex-col lg:hidden"
            >
              <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                    <BanknotesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100 text-sm">ExpenseTracker</p>
                    <p className="text-xs text-slate-500">Smart Finance</p>
                  </div>
                </Link>
                <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <NavLinks onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Mobile bottom tab bar
export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-200 border-t border-slate-700/50 flex">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link key={href} href={href} className="flex-1">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                active ? 'text-brand-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{label.split(' ')[0]}</span>
              {active && (
                <motion.div layoutId="mobileActiveIndicator" className="absolute top-1 w-1 h-1 rounded-full bg-brand-400" />
              )}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}

export default DesktopSidebar;

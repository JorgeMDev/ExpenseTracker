'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  ChartBarIcon, CreditCardIcon, DocumentChartBarIcon,
  Cog6ToothIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline';

const TEAL = '#10d9a0';

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
                  active ? 'border' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                style={active ? {
                  background: 'rgba(16,217,160,0.08)',
                  color: TEAL,
                  borderColor: 'rgba(16,217,160,0.2)',
                } : {}}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: TEAL }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ background: 'rgba(16,217,160,0.12)', border: '1px solid rgba(16,217,160,0.25)', color: TEAL }}
          >
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

function Logo({ onClick }) {
  return (
    <Link href="/dashboard" onClick={onClick} className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,217,160,0.12)', border: '1px solid rgba(16,217,160,0.25)' }}>
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M7 2v10M2 4.5h10M2 9.5h10" stroke={TEAL} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>ExpenseTracker</p>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 9.5, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginTop: 3 }}>Smart Finance</p>
      </div>
    </Link>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex w-64 bg-dark-200 border-r border-slate-700/50 flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-slate-700/50">
        <Logo />
      </div>
      <NavLinks />
    </aside>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-200 border-b border-slate-700/50 flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,217,160,0.12)', border: '1px solid rgba(16,217,160,0.25)' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7 2v10M2 4.5h10M2 9.5h10" stroke={TEAL} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>ExpenseTracker</span>
        </Link>
        <button onClick={() => setOpen(true)} className="p-2 text-slate-400 hover:text-slate-200">
          <Bars3Icon className="w-5 h-5" />
        </button>
      </header>

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
                <Logo onClick={() => setOpen(false)} />
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
              className="flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={{ color: active ? TEAL : '#64748b' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{label.split(' ')[0]}</span>
              {active && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute top-1 w-1 h-1 rounded-full"
                  style={{ background: TEAL }}
                />
              )}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}

export default DesktopSidebar;

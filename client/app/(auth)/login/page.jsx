'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const TEAL = '#10d9a0';

// Vertical line grid — atmosphere for the brand panel
function LineGrid() {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(
          90deg,
          rgba(255,255,255,0.028) 0px,
          rgba(255,255,255,0.028) 1px,
          transparent 1px,
          transparent 72px
        ), repeating-linear-gradient(
          0deg,
          rgba(255,255,255,0.018) 0px,
          rgba(255,255,255,0.018) 1px,
          transparent 1px,
          transparent 72px
        )`,
      }}
    />
  );
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.09 } } },
  item: {
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#04070e' }}>

      {/* ── Left: Brand panel ── */}
      <div className="hidden lg:flex w-[56%] relative flex-col" style={{ background: '#04070e' }}>
        <LineGrid />

        {/* Teal atmospheric glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 10% 65%, rgba(16,217,160,0.1) 0%, transparent 100%)',
        }} />

        {/* Edge fade toward form */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right, transparent 60%, #04070e 100%)',
        }} />

        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="relative z-10 flex flex-col h-full px-16 pt-14 pb-12"
        >
          {/* Wordmark */}
          <motion.div variants={stagger.item} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,217,160,0.14)', border: '1px solid rgba(16,217,160,0.28)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2v10M2 4.5h10M2 9.5h10" stroke={TEAL} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
              ExpenseTracker
            </span>
          </motion.div>

          {/* Main headline */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.p
              variants={stagger.item}
              style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: TEAL, marginBottom: 28 }}
            >
              Private Financial Intelligence
            </motion.p>

            <motion.h1
              variants={stagger.item}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '4.4rem',
                fontWeight: 300,
                lineHeight: 1.06,
                letterSpacing: '-0.01em',
                color: '#f0f4f8',
              }}
            >
              Every dollar,
              <br />
              <em style={{ fontStyle: 'italic', color: TEAL }}>accounted for.</em>
            </motion.h1>

            <motion.p
              variants={stagger.item}
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '1rem', color: 'rgba(255,255,255,0.38)', marginTop: 24, lineHeight: 1.7, maxWidth: 380 }}
            >
              Sync your accounts, categorize transactions automatically,
              and maximize your tax deductions — all in one place.
            </motion.p>

            <motion.div variants={stagger.item} style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Bank-grade encryption', 'Your data never leaves your control'],
                ['Automatic deduction detection', 'AI flags expenses you can write off'],
                ['Real-time cash flow', 'Know your net position at any moment'],
              ].map(([title, desc]) => (
                <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 1, height: 32, background: TEAL, opacity: 0.5, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{title}</p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <motion.p
            variants={stagger.item}
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.02em' }}
          >
            Built for those who take their finances seriously.
          </motion.p>
        </motion.div>
      </div>

      {/* ── Right: Form panel ── */}
      <div
        className="flex-1 flex items-center justify-center px-8 py-12"
        style={{ background: '#070c18', borderLeft: '1px solid rgba(255,255,255,0.04)' }}
      >
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 340 }}
        >
          {/* Mobile wordmark */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,217,160,0.14)', border: '1px solid rgba(16,217,160,0.28)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2v10M2 4.5h10M2 9.5h10" stroke={TEAL} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
              ExpenseTracker
            </span>
          </div>

          {/* Form header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '2rem', color: '#eef2f7', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Sign in
            </h2>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
              Access your financial overview.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                Email
              </label>
              <input
                {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  display: 'block', width: '100%', padding: '12px 14px',
                  fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300,
                  color: '#eef2f7', background: 'rgba(255,255,255,0.04)',
                  border: errors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(16,217,160,0.45)'; }}
                onBlur={e => { e.target.style.borderColor = errors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; }}
              />
              {errors.email && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: 'rgba(239,68,68,0.8)', marginTop: 5 }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password', { required: 'Required' })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    display: 'block', width: '100%', padding: '12px 42px 12px 14px',
                    fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300,
                    color: '#eef2f7', background: 'rgba(255,255,255,0.04)',
                    border: errors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(16,217,160,0.45)'; }}
                  onBlur={e => { e.target.style.borderColor = errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  {showPassword ? <EyeSlashIcon style={{ width: 16, height: 16 }} /> : <EyeIcon style={{ width: 16, height: 16 }} />}
                </button>
              </div>
              {errors.password && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: 'rgba(239,68,68,0.8)', marginTop: 5 }}>{errors.password.message}</p>}
            </div>

            {/* CTA */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.012 }}
              whileTap={{ scale: loading ? 1 : 0.987 }}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 10,
                fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500,
                letterSpacing: '0.05em',
                background: loading ? 'rgba(16,217,160,0.25)' : `linear-gradient(135deg, ${TEAL} 0%, #0abf8a 100%)`,
                color: '#03100c',
                border: 'none', cursor: loading ? 'default' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 32px rgba(16,217,160,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'box-shadow 0.2s',
              }}
            >
              {loading
                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(3,16,12,0.4)', borderTopColor: '#03100c', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : 'Continue'
              }
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.25)', marginTop: 28 }}>
            No account?{' '}
            <Link href="/register" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.18); }
      `}</style>
    </div>
  );
}

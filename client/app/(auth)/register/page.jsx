'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const TEAL = '#10d9a0';

function LineGrid() {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(
          90deg,
          rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px,
          transparent 1px, transparent 72px
        ), repeating-linear-gradient(
          0deg,
          rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px,
          transparent 1px, transparent 72px
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

const FieldLabel = ({ children }) => (
  <label style={{ display: 'block', fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
    {children}
  </label>
);

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.name);
      toast.success('Account created');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    display: 'block', width: '100%', padding: '12px 14px',
    fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300,
    color: '#eef2f7', background: 'rgba(255,255,255,0.04)',
    border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, outline: 'none', transition: 'border-color 0.2s',
  });

  const handleFocus = e => { e.target.style.borderColor = 'rgba(16,217,160,0.45)'; };
  const handleBlur = (hasError) => e => { e.target.style.borderColor = hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; };

  return (
    <div className="min-h-screen flex" style={{ background: '#04070e' }}>

      {/* ── Left: Brand panel ── */}
      <div className="hidden lg:flex w-[56%] relative flex-col" style={{ background: '#04070e' }}>
        <LineGrid />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 10% 55%, rgba(16,217,160,0.1) 0%, transparent 100%)',
        }} />
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

          <div className="flex-1 flex flex-col justify-center">
            <motion.p
              variants={stagger.item}
              style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: TEAL, marginBottom: 28 }}
            >
              Begin for free
            </motion.p>

            <motion.h1
              variants={stagger.item}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '4.4rem', fontWeight: 300,
                lineHeight: 1.06, letterSpacing: '-0.01em', color: '#f0f4f8',
              }}
            >
              Take control of<br />
              <em style={{ fontStyle: 'italic', color: TEAL }}>your finances.</em>
            </motion.h1>

            <motion.p
              variants={stagger.item}
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '1rem', color: 'rgba(255,255,255,0.38)', marginTop: 24, lineHeight: 1.7, maxWidth: 380 }}
            >
              Join professionals who track smarter, deduct more,
              and make better financial decisions.
            </motion.p>

            <motion.div variants={stagger.item} style={{ marginTop: 44, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Free forever', 'No credit card needed'],
                ['2 min setup', 'Import your statements'],
                ['256-bit AES', 'Bank-grade security'],
                ['Smart deductions', 'AI-powered tax help'],
              ].map(([stat, label]) => (
                <div key={stat} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>{stat}</p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

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

          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '2rem', color: '#eef2f7', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Create account
            </h2>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
              Free. No card required. Takes 2 minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 18 }}>
              <FieldLabel>Full name</FieldLabel>
              <input
                {...register('name', { required: 'Required' })}
                type="text"
                placeholder="Alex Johnson"
                style={inputStyle(!!errors.name)}
                onFocus={handleFocus}
                onBlur={handleBlur(!!errors.name)}
              />
              {errors.name && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: 'rgba(239,68,68,0.8)', marginTop: 5 }}>{errors.name.message}</p>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <FieldLabel>Email address</FieldLabel>
              <input
                {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
                type="email"
                placeholder="you@example.com"
                style={inputStyle(!!errors.email)}
                onFocus={handleFocus}
                onBlur={handleBlur(!!errors.email)}
              />
              {errors.email && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: 'rgba(239,68,68,0.8)', marginTop: 5 }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: 28 }}>
              <FieldLabel>Password</FieldLabel>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min. 8 characters' } })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle(!!errors.password), paddingRight: 42 }}
                  onFocus={handleFocus}
                  onBlur={handleBlur(!!errors.password)}
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
                color: '#03100c', border: 'none', cursor: loading ? 'default' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 32px rgba(16,217,160,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'box-shadow 0.2s',
              }}
            >
              {loading
                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(3,16,12,0.4)', borderTopColor: '#03100c', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : 'Create account'
              }
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.25)', marginTop: 28 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 500 }}>
              Sign in
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

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowRight, Mail, Lock, CheckCircle, User, Phone, Calendar, KeyRound } from 'lucide-react'
import Link from 'next/link'

type LoginStep = 'credentials' | 'otp' | 'done'
type PageMode = 'login' | 'forgot'

export default function LoginPage() {
    const router = useRouter()
    const [pageMode, setPageMode] = useState<PageMode>('login')

    // ── Credentials step ──
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [credLoading, setCredLoading] = useState(false)

    // ── OTP step ──
    const [loginStep, setLoginStep] = useState<LoginStep>('credentials')
    const [otpPhone, setOtpPhone] = useState('')   // phone key used for otp_requests lookup
    const [maskedEmail, setMaskedEmail] = useState('') // e.g. ab***n@gmail.com
    const [otpCode, setOtpCode] = useState('')
    const [otpVerifying, setOtpVerifying] = useState(false)
    const [resending, setResending] = useState(false)

    // ── Forgot password ──
    const [fpName, setFpName] = useState('')
    const [fpEmail, setFpEmail] = useState('')
    const [fpPhone, setFpPhone] = useState('')
    const [fpDob, setFpDob] = useState('')
    const [fpNewPassword, setFpNewPassword] = useState('')
    const [fpConfirm, setFpConfirm] = useState('')
    const [fpLoading, setFpLoading] = useState(false)
    const [fpDone, setFpDone] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('user_token')
        if (token) router.push('/dashboard')
    }, [router])

    // Step 1: verify email+password → trigger OTP
    const handleCredentials = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim() || !password) return toast.error('Please fill all fields')
        setCredLoading(true)
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Login failed')
            // Server auto-sent OTP to registered email
            setOtpPhone(data.phone)
            setMaskedEmail(data.maskedEmail || 'your email')
            toast.success('OTP sent to your registered email!')
            setLoginStep('otp')
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setCredLoading(false)
        }
    }

    // Step 2: verify OTP → get JWT
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otpCode.trim()) return toast.error('Please enter the OTP')
        setOtpVerifying(true)
        try {
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: otpPhone, otp: otpCode, mode: 'login' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'OTP verification failed')
            localStorage.setItem('user_token', data.token)
            localStorage.setItem('user_id', data.userId)
            toast.success('Welcome back! 👋')
            setLoginStep('done')
            setTimeout(() => router.push('/dashboard'), 1200)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setOtpVerifying(false)
        }
    }

    const handleResendOTP = async () => {
        setResending(true)
        try {
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: otpPhone, mode: 'login' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to resend')
            toast.success('OTP resent!')
            setOtpCode('')
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to resend OTP')
        } finally {
            setResending(false)
        }
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fpName.trim() || !fpEmail.trim() || !fpPhone.trim() || !fpDob || !fpNewPassword) {
            return toast.error('Please fill all fields')
        }
        if (fpNewPassword !== fpConfirm) return toast.error('Passwords do not match')
        if (fpNewPassword.length < 6) return toast.error('Password must be at least 6 characters')
        setFpLoading(true)
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: fpName, email: fpEmail, phone: fpPhone, dob: fpDob, newPassword: fpNewPassword }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Reset failed')
            setFpDone(true)
            toast.success('Password reset successfully! 🎉')
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setFpLoading(false)
        }
    }

    const labelStyle: React.CSSProperties = {
        fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
    }

    return (
        <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, textDecoration: 'none', color: 'var(--text-primary)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                <span style={{ fontWeight: 800, fontSize: 16 }}>AI<span style={{ color: 'var(--accent-purple-light)' }}>Referral</span></span>
            </Link>

            <div className="glass-card" style={{ width: '100%', maxWidth: 430, padding: '40px 36px' }}>

                {/* ── FORGOT PASSWORD ── */}
                {pageMode === 'forgot' && !fpDone && (
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <button type="button" onClick={() => setPageMode('login')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: 0 }}>
                                ← Back to login
                            </button>
                            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Reset Password</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                                Enter the details you used when registering. All fields must match exactly.
                            </p>
                        </div>
                        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={labelStyle}><User size={14} /> Full Name</label>
                                <input className="input-field" type="text" placeholder="As entered at registration"
                                    value={fpName} onChange={e => setFpName(e.target.value)} required />
                            </div>
                            <div>
                                <label style={labelStyle}><Mail size={14} /> Email Address</label>
                                <input className="input-field" type="email" placeholder="you@example.com"
                                    value={fpEmail} onChange={e => setFpEmail(e.target.value)} required autoFocus />
                            </div>
                            <div>
                                <label style={labelStyle}><Phone size={14} /> Phone Number</label>
                                <input className="input-field" type="tel" placeholder="10-digit mobile number"
                                    value={fpPhone} onChange={e => setFpPhone(e.target.value)} required />
                            </div>
                            <div>
                                <label style={labelStyle}><Calendar size={14} /> Date of Birth</label>
                                <input className="input-field" type="date" value={fpDob} onChange={e => setFpDob(e.target.value)}
                                    required style={{ colorScheme: 'dark' }} />
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                                <div>
                                    <label style={labelStyle}><KeyRound size={14} /> New Password</label>
                                    <input className="input-field" type="password" placeholder="Min. 6 characters"
                                        value={fpNewPassword} onChange={e => setFpNewPassword(e.target.value)} required />
                                </div>
                                <div style={{ marginTop: 14 }}>
                                    <label style={labelStyle}><Lock size={14} /> Confirm New Password</label>
                                    <input className="input-field" type="password" placeholder="Repeat new password"
                                        value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" disabled={fpLoading} style={{ justifyContent: 'center', marginTop: 4 }}>
                                {fpLoading ? 'Verifying...' : <><KeyRound size={16} /> Reset Password</>}
                            </button>
                        </form>
                    </>
                )}

                {pageMode === 'forgot' && fpDone && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 20px', display: 'block' }} />
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Password Reset! 🎉</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
                            Your password has been updated. You can now log in with your new password.
                        </p>
                        <button onClick={() => { setPageMode('login'); setFpDone(false); setLoginStep('credentials') }}
                            className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                            Go to Login <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {/* ── LOGIN MODE ── */}
                {pageMode === 'login' && (
                    <>
                        {/* STEP: DONE */}
                        {loginStep === 'done' && (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 20px', display: 'block' }} />
                                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Logged in! 👋</h2>
                                <p style={{ color: 'var(--text-secondary)' }}>Redirecting to your dashboard...</p>
                            </div>
                        )}

                        {/* STEP: OTP */}
                        {loginStep === 'otp' && (
                            <>
                                <div style={{ marginBottom: 28 }}>
                                    <button type="button" onClick={() => setLoginStep('credentials')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: 0 }}>
                                        ← Change account
                                    </button>
                                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Verify Your Email</h1>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                                        We sent a 6-digit OTP to <strong style={{ color: 'var(--text-primary)' }}>{maskedEmail}</strong>. Check your inbox to log in.
                                    </p>
                                </div>
                                <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={labelStyle}><KeyRound size={14} /> Enter OTP</label>
                                        <input
                                            className="input-field"
                                            type="text"
                                            placeholder="6-digit code"
                                            value={otpCode}
                                            onChange={e => setOtpCode(e.target.value)}
                                            maxLength={6}
                                            required
                                            autoFocus
                                            style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center' }}
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={otpVerifying} style={{ justifyContent: 'center' }}>
                                        {otpVerifying ? 'Verifying...' : <>Verify & Login <ArrowRight size={16} /></>}
                                    </button>
                                    <button type="button" onClick={handleResendOTP} disabled={resending}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-purple-light)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                                        {resending ? 'Resending...' : "Didn't receive it? Resend OTP"}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* STEP: CREDENTIALS */}
                        {loginStep === 'credentials' && (
                            <>
                                <div style={{ marginBottom: 32 }}>
                                    <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Welcome Back</h1>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                        Log in with your email & password. We&apos;ll verify via OTP.
                                    </p>
                                </div>
                                <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={labelStyle}><Mail size={14} /> Email Address</label>
                                        <input className="input-field" type="email" placeholder="you@example.com"
                                            value={email} onChange={e => setEmail(e.target.value)}
                                            required autoComplete="email" autoFocus />
                                    </div>
                                    <div>
                                        <label style={labelStyle}><Lock size={14} /> Password</label>
                                        <input className="input-field" type="password" placeholder="••••••••"
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            required autoComplete="current-password" />
                                    </div>
                                    <div style={{ textAlign: 'right', marginTop: -8 }}>
                                        <button type="button" onClick={() => setPageMode('forgot')}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-purple-light)', fontSize: 13, fontWeight: 600 }}>
                                            Forgot password?
                                        </button>
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={credLoading} style={{ justifyContent: 'center', marginTop: 4 }}>
                                        {credLoading ? 'Sending OTP...' : <>Continue <ArrowRight size={16} /></>}
                                    </button>
                                </form>
                            </>
                        )}
                    </>
                )}
            </div>

            <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: 'var(--accent-purple-light)', fontWeight: 600 }}>
                    Register here →
                </Link>
            </p>
        </div>
    )
}

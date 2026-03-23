'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowRight, Mail, User, Phone, Lock, Shield, CheckCircle, KeyRound } from 'lucide-react'
import Link from 'next/link'

type Step = 'form' | 'otp' | 'done'

export default function RegisterPage() {
    const router = useRouter()

    // Step state
    const [step, setStep] = useState<Step>('form')

    // Form fields
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [refCode, setRefCode] = useState('')

    // OTP state
    const [otpCode, setOtpCode] = useState('')
    const [verifiedToken, setVerifiedToken] = useState('')
    const [maskedEmail, setMaskedEmail] = useState('')
    const [sendingOTP, setSendingOTP] = useState(false)
    const [verifyingOTP, setVerifyingOTP] = useState(false)
    const [registering, setRegistering] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('user_token')
        if (token) { router.replace('/dashboard'); return }
        const params = new URLSearchParams(window.location.search)
        const ref = params.get('ref')
        if (ref) setRefCode(ref)
    }, [router])

    // Step 1: validate form and send OTP
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !email.trim() || !phone.trim() || !password) return toast.error('Please fill all fields')
        if (!/\S+@\S+\.\S+/.test(email)) return toast.error('Enter a valid email address')
        if (!/^\d{10}$/.test(phone.replace(/[\s\-+]/g, '').replace(/^91/, '').replace(/^0/, ''))) return toast.error('Enter a valid 10-digit phone number')
        if (password.length < 6) return toast.error('Password must be at least 6 characters')
        if (password !== confirmPassword) return toast.error('Passwords do not match')

        setSendingOTP(true)
        try {
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, email, mode: 'register' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
            setMaskedEmail(data.maskedEmail || email)
            toast.success(data.message || 'OTP sent to your email!')
            setStep('otp')
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setSendingOTP(false)
        }
    }

    // Step 2a: verify OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otpCode.trim()) return toast.error('Please enter the OTP')
        setVerifyingOTP(true)
        try {
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp: otpCode, mode: 'register' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'OTP verification failed')
            setVerifiedToken(data.verifiedToken)
            // Proceed to register
            await doRegister(data.verifiedToken)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setVerifyingOTP(false)
        }
    }

    // Step 2b: create account after OTP verified
    const doRegister = async (token: string) => {
        setRegistering(true)
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password, referredBy: refCode, verifiedToken: token }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Registration failed')
            localStorage.setItem('user_token', data.token)
            localStorage.setItem('user_id', data.userId)
            toast.success('Welcome to the competition! 🎉')
            setStep('done')
            setTimeout(() => router.push('/dashboard'), 1500)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong')
            setStep('form') // fallback to form on error
        } finally {
            setRegistering(false)
        }
    }

    const resendOTP = async () => {
        setSendingOTP(true)
        try {
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, mode: 'register' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to resend OTP')
            toast.success('OTP resent!')
            setOtpCode('')
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setSendingOTP(false)
        }
    }

    const labelStyle: React.CSSProperties = {
        fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
    }

    return (
        <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, textDecoration: 'none', color: 'var(--text-primary)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                <span style={{ fontWeight: 800, fontSize: 16 }}>AI<span style={{ color: 'var(--accent-purple-light)' }}>Referral</span></span>
            </Link>

            {/* Warning banner — shown only on form step */}
            {step === 'form' && (
                <div style={{
                    width: '100%', maxWidth: 440, marginBottom: 20,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 12, padding: '14px 18px',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#f87171', marginBottom: 4 }}>
                            You must join the Team Google AI WhatsApp Channel first
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                            Only channel members via QR code are eligible. Our system runs a <strong style={{ color: 'var(--text-primary)' }}>daily verification</strong> — if your phone number is not found in the channel, you will be <strong style={{ color: '#f87171' }}>disqualified</strong>.
                        </p>
                    </div>
                </div>
            )}

            <div className="glass-card" style={{ width: '100%', maxWidth: 440, padding: '40px 36px' }}>

                {/* ── STEP: DONE ── */}
                {step === 'done' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 20px', display: 'block' }} />
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>You&apos;re in! 🎉</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Redirecting to your dashboard...</p>
                    </div>
                )}

                {/* ── STEP: OTP ── */}
                {step === 'otp' && (
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <button type="button" onClick={() => setStep('form')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: 0 }}>
                                ← Back
                            </button>
                            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Verify Your Email</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                                We sent a 6-digit OTP to <strong style={{ color: 'var(--text-primary)' }}>{maskedEmail}</strong>. Check your inbox.
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

                            <button type="submit" className="btn-primary" disabled={verifyingOTP || registering} style={{ justifyContent: 'center' }}>
                                {verifyingOTP || registering ? 'Verifying...' : <>Verify & Create Account <ArrowRight size={16} /></>}
                            </button>

                            <button type="button" onClick={resendOTP} disabled={sendingOTP}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-purple-light)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                                {sendingOTP ? 'Resending...' : "Didn't receive it? Resend OTP"}
                            </button>
                        </form>
                    </>
                )}

                {/* ── STEP: FORM ── */}
                {step === 'form' && (
                    <>
                        <div style={{ marginBottom: 32 }}>
                            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Join the Contest</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                Register free. Get your unique referral link. Start winning.
                            </p>
                            {refCode && (
                                <div style={{ marginTop: 14 }} className="badge badge-purple">
                                    🔗 You were invited with a referral link
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={labelStyle}><User size={14} /> Full Name</label>
                                <input className="input-field" type="text" placeholder="Your name"
                                    value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
                            </div>
                            <div>
                                <label style={labelStyle}><Mail size={14} /> Email Address</label>
                                <input className="input-field" type="email" placeholder="you@example.com"
                                    value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                            </div>
                            <div>
                                <label style={labelStyle}><Phone size={14} /> Phone Number</label>
                                <input className="input-field" type="tel" placeholder="10-digit mobile number"
                                    value={phone} onChange={e => setPhone(e.target.value)} required autoComplete="tel" />
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>
                                    Used for WhatsApp channel verification only. OTP is sent to your email.
                                </p>
                            </div>
                            <div>
                                <label style={labelStyle}><Lock size={14} /> Password</label>
                                <input className="input-field" type="password" placeholder="Min. 6 characters"
                                    value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
                            </div>
                            <div>
                                <label style={labelStyle}><Lock size={14} /> Confirm Password</label>
                                <input className="input-field" type="password" placeholder="Repeat your password"
                                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                            </div>

                            <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Shield size={16} color="#10b981" />
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    Your info is only used for contest verification. No spam ever.
                                </p>
                            </div>

                            <button type="submit" className="btn-primary" disabled={sendingOTP} style={{ justifyContent: 'center', marginTop: 4 }}>
                                {sendingOTP ? 'Sending OTP...' : <>Next: Verify Email <ArrowRight size={16} /></>}
                            </button>
                        </form>
                    </>
                )}
            </div>

            <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                Already registered?{' '}
                <Link href="/login" style={{ color: 'var(--accent-purple-light)', fontWeight: 600 }}>
                    Log in →
                </Link>
            </p>
        </div>
    )
}

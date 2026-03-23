'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { Suspense } from 'react'

const WHATSAPP_LINK = 'https://bit.ly/3MPdd0g'
// localStorage key — change version to reset all devices if needed
const JOINED_KEY = 'wn_joined_v1'

interface ReferrerInfo { name: string; referral_count: number }

function JoinContent() {
    const router = useRouter()
    const params = useSearchParams()
    const refCode = (params.get('ref') || '').toUpperCase()

    const [referrer, setReferrer] = useState<ReferrerInfo | null>(null)
    const [step, setStep] = useState<'checking' | 'join' | 'confirm' | 'done' | 'alreadyJoined'>('checking')
    const [loading, setLoading] = useState(false)
    const didOpenWhatsApp = useRef(false)

    // On mount: check if this device already confirmed a join
    useEffect(() => {
        const alreadyJoined = localStorage.getItem(JOINED_KEY)
        if (alreadyJoined) {
            setStep('alreadyJoined')
            return
        }
        setStep('join')
        if (refCode) {
            fetch(`/api/referral/info?code=${refCode}`)
                .then(r => r.json())
                .then(d => { if (d.name) setReferrer(d) })
                .catch(() => { })
        }
    }, [refCode])

    // Detect when user comes BACK to this tab after opening WhatsApp
    useEffect(() => {
        const handler = () => {
            if (document.visibilityState === 'visible' && didOpenWhatsApp.current) {
                didOpenWhatsApp.current = false
                setStep('confirm')
            }
        }
        document.addEventListener('visibilitychange', handler)
        return () => document.removeEventListener('visibilitychange', handler)
    }, [])

    const handleWhatsAppLinkClick = () => {
        didOpenWhatsApp.current = true
    }

    const handleConfirmJoin = async () => {
        setLoading(true)
        try {
            // Fire both in parallel: global WhatsApp click count + referral credit
            const requests: Promise<Response>[] = [
                fetch('/api/whatsapp/click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refCode }),
                }),
            ]
            if (refCode) {
                requests.push(
                    fetch('/api/referral/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ referrerCode: refCode }),
                    })
                )
            }
            const [clickRes, trackRes] = await Promise.all(requests)
            if (trackRes) {
                const trackData = await trackRes.json()
                if (!trackRes.ok && !trackData.alreadyCounted) {
                    console.warn('[Join] Track error:', trackData.error)
                }
            }
            // Mark this device as confirmed — prevents re-counting
            localStorage.setItem(JOINED_KEY, refCode || '1')
            setStep('done')
            setTimeout(() => router.push('/'), 1500)
        } catch (err) {
            console.error('[Join] confirm error:', err)
            toast.error('Network error — please try again')
        } finally {
            setLoading(false)
        }
    }

    if (step === 'checking') {
        return <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
    }

    return (
        <div style={{ width: '100%', maxWidth: 480 }}>
            {/* ── ALREADY JOINED ── */}
            {step === 'alreadyJoined' && (
                <div className="glass-card" style={{ padding: '40px 32px', textAlign: 'center' }}>
                    <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 20px', display: 'block' }} />
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>You&apos;ve Already Joined! ✅</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.7 }}>
                        This device has already confirmed joining the Team Google AI WhatsApp Channel.
                    </p>
                    <Link href="/" className="btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginBottom: 10 }}>
                        Go to Homepage
                    </Link>
                    <Link href="/register" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                        Register / Login
                    </Link>
                </div>
            )}

            {/* ── JOIN / CONFIRM / DONE ── */}
            {step !== 'alreadyJoined' && (
                <>
                    {/* Referrer badge */}
                    {referrer && (
                        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                                {referrer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>You were invited by</p>
                                <p style={{ fontWeight: 700, fontSize: 16 }}>{referrer.name}</p>
                                <p style={{ fontSize: 12, color: 'var(--accent-purple-light)' }}>{referrer.referral_count} successful invites so far</p>
                            </div>
                        </div>
                    )}

                    <div className="glass-card" style={{ padding: '36px 32px', textAlign: 'center' }}>
                        {/* JOIN */}
                        {step === 'join' && (
                            <>
                                <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
                                <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>
                                    Join <span className="gradient-text">Team Google AI</span> on WhatsApp
                                </h1>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}>
                                    Tap below to join the official <strong style={{ color: 'var(--text-primary)' }}>Team Google AI WhatsApp Channel</strong>. Then come back here to confirm.
                                </p>
                                <div style={{ display: 'inline-block', borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(16,185,129,0.4)', boxShadow: '0 0 30px rgba(16,185,129,0.2)', marginBottom: 24 }}>
                                    <img src="/whatsapp-qr.jpg" alt="Team Google AI WhatsApp Channel QR Code" style={{ width: 220, height: 220, objectFit: 'cover', display: 'block' }} />
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Scan with your camera — or tap below to join directly.</p>
                                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"
                                    style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
                                    onClick={handleWhatsAppLinkClick}>
                                    💬 Join Team Google AI Channel
                                </a>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 14, marginBottom: 12 }}>
                                    👆 After joining, come back here — a confirmation will appear automatically.
                                </p>
                                <Link href="/" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                                    ← Go to Homepage
                                </Link>
                            </>
                        )}

                        {/* CONFIRM */}
                        {step === 'confirm' && (
                            <>
                                <div style={{ fontSize: 56, marginBottom: 16 }}>📲</div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Did you join the channel?</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>
                                    Confirm you&apos;ve joined the <strong style={{ color: 'var(--text-primary)' }}>Team Google AI WhatsApp Channel</strong>.
                                    {referrer && <> This credits <strong style={{ color: 'var(--text-primary)' }}>{referrer.name}</strong> with a referral point.</>}
                                </p>
                                <button onClick={handleConfirmJoin} disabled={loading} className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
                                    <CheckCircle size={18} />
                                    {loading ? 'Confirming...' : "✅ Yes, I've Joined!"}
                                </button>
                                <button onClick={() => setStep('join')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                    <ExternalLink size={16} /> Not yet — Take me back
                                </button>
                            </>
                        )}

                        {/* DONE */}
                        {step === 'done' && (
                            <>
                                <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 20px', display: 'block' }} />
                                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>You&apos;re In! 🎉</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.7 }}>
                                    Welcome to the Team Google AI WhatsApp Channel! Taking you to registration...
                                </p>
                                <Link href="/"
                                    className="btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                                    Go to Homepage →
                                </Link>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default function JoinPage() {
    return (
        <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none', color: 'var(--text-primary)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                <span style={{ fontWeight: 800, fontSize: 16 }}>AI<span style={{ color: 'var(--accent-purple-light)' }}>Referral</span></span>
            </Link>
            <Suspense fallback={<div style={{ color: 'var(--text-secondary)' }}>Loading...</div>}>
                <JoinContent />
            </Suspense>
        </div>
    )
}

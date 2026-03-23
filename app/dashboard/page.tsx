'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ShareButtons from '@/components/ShareButtons'
import QRCodeCard from '@/components/QRCodeCard'
import Leaderboard from '@/components/Leaderboard'
import { Trophy, Users, TrendingUp, ArrowUp, LogOut, RefreshCw } from 'lucide-react'

interface UserData {
    id: string
    name: string
    email: string
    referral_code: string
    referral_count: number
    rank: number
    joined_whatsapp: boolean
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [totalParticipants, setTotalParticipants] = useState(0)

    const fetchData = (silent = false) => {
        const token = localStorage.getItem('user_token')
        const userId = localStorage.getItem('user_id')
        if (!token || !userId) { router.push('/login'); return }
        if (!silent) setLoading(true)
        else setRefreshing(true)
        fetch('/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (data.error) { router.push('/register'); return }
                setUser(data.user)
                setTotalParticipants(data.totalParticipants || 0)
                if (silent) toast.success('Dashboard refreshed!')
            })
            .catch(() => router.push('/register'))
            .finally(() => { setLoading(false); setRefreshing(false) })
    }

    useEffect(() => { fetchData() }, [router])

    const handleMarkJoined = async () => {
        const token = localStorage.getItem('user_token')
        const res = await fetch('/api/user/mark-joined', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok) {
            toast.success('Thanks for confirming! ✅')
            setUser(prev => prev ? { ...prev, joined_whatsapp: true } : prev)
        } else {
            toast.error(data.error || 'Something went wrong')
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('user_token')
        localStorage.removeItem('user_id')
        router.push('/')
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <div className="pulse-glow" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-purple)' }} />
            </div>
        )
    }

    if (!user) return null

    const referralLink = `${BASE_URL}/join?ref=${user.referral_code}`
    const invitesNeeded = Math.max(0, 10 - user.referral_count)
    const progressToTop10 = Math.min(100, (user.referral_count / Math.max(10, user.referral_count + invitesNeeded)) * 100)

    return (
        <div className="hero-bg" style={{ minHeight: '100vh' }}>
            {/* NAV */}
            <nav style={{
                padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)'
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-primary)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>AI<span style={{ color: 'var(--accent-purple-light)' }}>Referral</span></span>
                </Link>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => fetchData(true)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 14 }} disabled={refreshing} title="Refresh dashboard">
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <Link href="/leaderboard" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 14 }}>
                        <Trophy size={14} /> Leaderboard
                    </Link>
                    <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 14 }}>
                        <LogOut size={14} />
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>
                {/* GREETING */}
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                        Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}</span> 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                        Your referral dashboard · <span style={{ color: '#10b981', fontWeight: 600 }}>{totalParticipants.toLocaleString()} participants</span> competing
                    </p>
                </div>

                {/* WHATSAPP JOIN NUDGE */}
                {!user.joined_whatsapp && (
                    <div className="glass-card" style={{ padding: 20, marginBottom: 24, border: '1px solid rgba(37, 211, 102, 0.3)', background: 'rgba(37, 211, 102, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🟢 Have you joined the Team Google AI WhatsApp Channel yet?</p>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Join first, then start inviting others!</p>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button onClick={() => router.push('/#qr-section')} className="btn-whatsapp" style={{ width: 'auto', padding: '10px 20px', fontSize: 14 }}>
                                    📱 Scan QR to Join
                                </button>
                                <button onClick={handleMarkJoined} className="btn-secondary" style={{ fontSize: 13, padding: '10px 16px' }}>
                                    ✅ I&apos;ve Joined
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STATS CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                    {[
                        { icon: <Users size={20} color="var(--accent-purple-light)" />, label: 'Successful Invites', value: user.referral_count, color: 'var(--accent-purple-light)' },
                        { icon: <Trophy size={20} color="#f59e0b" />, label: 'Your Rank', value: user.rank > 0 ? `#${user.rank}` : '—', color: '#f59e0b' },
                        { icon: <TrendingUp size={20} color="#10b981" />, label: 'Total Participants', value: totalParticipants.toLocaleString(), color: '#10b981' },
                    ].map(({ icon, label, value, color }) => (
                        <div key={label} className="glass-card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
                                {icon} {label}
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 900, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* PROGRESS TO TOP 10 */}
                {user.rank > 10 && (
                    <div className="glass-card" style={{ padding: 20, marginBottom: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ArrowUp size={16} color="var(--accent-purple-light)" />
                                <span style={{ fontWeight: 600, fontSize: 14 }}>Progress to Top 10</span>
                            </div>
                            <span className="badge badge-purple">
                                {invitesNeeded > 0 ? `${invitesNeeded} more to go` : 'Top 10! 🎉'}
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                            <div className="progress-bar-inner" style={{ width: `${progressToTop10}%` }} />
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                            {invitesNeeded > 0
                                ? `You need ${invitesNeeded} more invite${invitesNeeded !== 1 ? 's' : ''} to enter the Top 10!`
                                : `You're in the Top 10! Keep pushing to reach #1 🏆`}
                        </p>
                    </div>
                )}

                {user.rank <= 10 && user.rank > 0 && (
                    <div className="glass-card" style={{ padding: 16, marginBottom: 28, border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245,158,11,0.05)' }}>
                        <p style={{ fontWeight: 700, color: '#f59e0b' }}>🏆 You&apos;re in the Top 10! Keep inviting to stay there!</p>
                    </div>
                )}

                {/* SHARE SECTION */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📤 Share Your Link</h2>
                        <ShareButtons referralLink={referralLink} referralCode={user.referral_code} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, alignSelf: 'flex-start' }}>📱 Your QR Code</h2>
                        <QRCodeCard value={referralLink} label="Scan to join via my link" size={160} />
                    </div>
                </div>

                {/* LEADERBOARD */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>🏆 Leaderboard</h2>
                        <Link href="/leaderboard" style={{ fontSize: 13, color: 'var(--accent-purple-light)', fontWeight: 600 }}>View all →</Link>
                    </div>
                    <div className="glass-card" style={{ padding: 20 }}>
                        <Leaderboard limit={10} currentUserId={user.id} autoRefresh />
                    </div>
                </div>
            </main>
        </div>
    )
}

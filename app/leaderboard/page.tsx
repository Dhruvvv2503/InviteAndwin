'use client'
import { useState } from 'react'
import Link from 'next/link'
import Leaderboard from '@/components/Leaderboard'
import CountdownTimer from '@/components/CountdownTimer'
import { Home, Trophy } from 'lucide-react'

export default function LeaderboardPage() {
    const [currentUserId] = useState<string>(() => {
        if (typeof window === 'undefined') return ''
        return localStorage.getItem('user_id') || ''
    })

    return (
        <div className="hero-bg" style={{ minHeight: '100vh' }}>
            {/* NAV */}
            <nav style={{
                padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-primary)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>AI<span style={{ color: 'var(--accent-purple-light)' }}>Referral</span></span>
                </Link>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link href="/" className="btn-secondary" style={{ padding: '8px 14px', fontSize: 14 }}>
                        <Home size={14} />
                    </Link>
                    <Link href="/dashboard" className="btn-primary" style={{ padding: '8px 16px', fontSize: 14 }}>
                        My Dashboard
                    </Link>
                </div>
            </nav>

            <main style={{ maxWidth: 700, margin: '0 auto', padding: '48px 20px 80px' }}>
                {/* HEADER */}
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <Trophy size={32} color="#f59e0b" />
                        <h1 style={{ fontSize: 36, fontWeight: 900 }}>Live<span className="gradient-text"> Leaderboard</span></h1>
                        <Trophy size={32} color="#f59e0b" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 28 }}>
                        Race to win an <strong style={{ color: '#f59e0b' }}>iPhone 17e</strong> 📱 · 20 prizes total · Updates every 30 seconds
                    </p>
                    <CountdownTimer />
                </div>

                {/* PRIZE REMINDER */}
                <div
                    className="glass-card glow-gold"
                    style={{ padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}
                >
                    <img src="/prize-iphone.png" alt="iPhone 17e" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
                            <span className="gradient-text-gold">iPhone 17e</span>
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            🥇 1st Place · Plus AirPods Pro (2nd) · ₹1,000 vouchers (3rd–10th) · ₹200 vouchers (11th–20th)
                        </p>
                    </div>
                    <Link href="/register" className="btn-primary" style={{ flexShrink: 0 }}>
                        Win iPhone 17e
                    </Link>
                </div>

                {/* FULL LEADERBOARD */}
                <div className="glass-card" style={{ padding: '24px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>All Participants</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 2s infinite' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Live</span>
                        </div>
                    </div>
                    <Leaderboard limit={100} currentUserId={currentUserId} autoRefresh />
                </div>

                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <Link href="/register" className="btn-primary" style={{ fontSize: 17, padding: '16px 36px' }}>
                        🚀 Start Competing — It&apos;s Free
                    </Link>
                </div>
            </main>
        </div>
    )
}

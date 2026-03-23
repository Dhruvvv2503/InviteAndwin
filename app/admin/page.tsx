'use client'
import { useState, useEffect } from 'react'
import { Shield, Download, Ban, Check, Users, Wifi, AlertTriangle, TrendingUp, Activity, BarChart3 } from 'lucide-react'

interface Stats {
    totalRegistrations: number
    totalWhatsappJoins: number
    totalReferrals: number
    conversionRate: number
    newToday: number
    newThisWeek: number
    topReferrer: { name: string; referral_count: number } | null
    suspiciousCount: number
    bannedCount: number
}

interface UserRow {
    id: string
    name: string
    email: string
    referral_count: number
    joined_whatsapp: boolean
    is_banned: boolean
    suspicious: boolean
    created_at: string
}

export default function AdminPage() {
    const [authed, setAuthed] = useState(false)
    const [secret, setSecret] = useState('')
    const [stats, setStats] = useState<Stats | null>(null)
    const [users, setUsers] = useState<UserRow[]>([])
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'fraud'>('overview')
    const [search, setSearch] = useState('')
    const [adjustId, setAdjustId] = useState('')
    const [adjustVal, setAdjustVal] = useState('')
    const [adjustReason, setAdjustReason] = useState('')


    const authenticate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const res = await fetch(`/api/admin?secret=${secret}`)
        if (res.ok) {
            const d = await res.json()
            setStats(d.stats)
            setUsers(d.users)
            setAuthed(true)
        } else {
            alert('Wrong password')
        }
        setLoading(false)
    }

    const refresh = async () => {
        const res = await fetch(`/api/admin?secret=${secret}`)
        if (res.ok) {
            const d = await res.json()
            setStats(d.stats)
            setUsers(d.users)
        }
    }

    const handleBan = async (userId: string, ban: boolean) => {
        await fetch(`/api/admin/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ban, secret }),
        })
        refresh()
    }

    const handleAdjust = async () => {
        if (!adjustId || !adjustVal || !adjustReason) return alert('Fill all fields')
        await fetch(`/api/admin/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: adjustId, newCount: parseInt(adjustVal), reason: adjustReason, secret }),
        })
        setAdjustId(''); setAdjustVal(''); setAdjustReason('')
        refresh()
    }

    const exportCSV = () => {
        const rows = [['Name', 'Email', 'Referrals', 'WA Joined', 'Banned', 'Registered'].join(',')]
        realUsers.forEach(u => rows.push([u.name, u.email, u.referral_count, u.joined_whatsapp, u.is_banned, u.created_at].join(',')))
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'leaderboard.csv'
        a.click()
    }

    const SEED_DOMAIN = '@seeded.fake'
    const realUsers = users.filter(u => !u.email.includes(SEED_DOMAIN))
    const filteredUsers = realUsers.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )

    if (!authed) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 20 }}>
                <div className="glass-card" style={{ padding: '40px 36px', maxWidth: 360, width: '100%', textAlign: 'center' }}>
                    <Shield size={40} color="var(--accent-purple-light)" style={{ marginBottom: 16 }} />
                    <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Admin Access</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>Enter admin password to continue</p>
                    <form onSubmit={authenticate}>
                        <input
                            className="input-field"
                            type="password"
                            placeholder="Admin password"
                            value={secret}
                            onChange={e => setSecret(e.target.value)}
                            style={{ marginBottom: 14 }}
                            autoFocus
                        />
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                            {loading ? 'Verifying...' : 'Enter Dashboard'}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    const TabBtn = ({ id, label, icon }: { id: 'overview' | 'users' | 'fraud'; label: string; icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600,
                fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                background: activeTab === id ? 'var(--accent-purple)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--text-secondary)',
            }}
        >
            {icon} {label}
        </button>
    )

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* NAV */}
            <nav style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Shield size={22} color="var(--accent-purple-light)" />
                    <span style={{ fontWeight: 800, fontSize: 18 }}>Admin Dashboard</span>
                    <span className="badge badge-purple">Secure</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={refresh} className="btn-secondary" style={{ fontSize: 13, padding: '8px 14px' }}>
                        <Activity size={14} /> Refresh
                    </button>
                    <button onClick={exportCSV} className="btn-secondary" style={{ fontSize: 13, padding: '8px 14px' }}>
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>
                {/* TABS */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
                    <TabBtn id="overview" label="Overview" icon={<BarChart3 size={14} />} />
                    <TabBtn id="users" label={`Users (${realUsers.length})`} icon={<Users size={14} />} />
                    <TabBtn id="fraud" label={`Fraud (${stats?.suspiciousCount || 0})`} icon={<AlertTriangle size={14} />} />
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && stats && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                            {[
                                { label: 'Total Registrations', value: stats.totalRegistrations.toLocaleString(), icon: <Users size={18} color="#7c3aed" />, color: '#7c3aed' },
                                { label: 'WhatsApp Joins', value: stats.totalWhatsappJoins.toLocaleString(), icon: <Wifi size={18} color="#25d366" />, color: '#25d366' },
                                { label: 'Total Referrals', value: stats.totalReferrals.toLocaleString(), icon: <TrendingUp size={18} color="#3b82f6" />, color: '#3b82f6' },
                                { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: <BarChart3 size={18} color="#f59e0b" />, color: '#f59e0b' },
                                { label: 'New Today', value: stats.newToday.toLocaleString(), icon: <Activity size={18} color="#10b981" />, color: '#10b981' },
                                { label: 'New This Week', value: stats.newThisWeek.toLocaleString(), icon: <Activity size={18} color="#a855f7" />, color: '#a855f7' },
                                { label: 'Suspicious Users', value: stats.suspiciousCount.toLocaleString(), icon: <AlertTriangle size={18} color="#ef4444" />, color: '#ef4444' },
                                { label: 'Banned Users', value: stats.bannedCount.toLocaleString(), icon: <Ban size={18} color="#9ca3af" />, color: '#9ca3af' },
                            ].map(({ label, value, icon, color }) => (
                                <div key={label} className="glass-card" style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--text-secondary)', fontSize: 12 }}>
                                        {icon} {label}
                                    </div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {stats.topReferrer && (
                            <div className="glass-card glow-gold" style={{ padding: 24, marginBottom: 24 }}>
                                <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>🏆 Current Top Referrer</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
                                        {stats.topReferrer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: 20 }}>{stats.topReferrer.name}</p>
                                        <p style={{ color: '#f59e0b', fontWeight: 700 }}>{stats.topReferrer.referral_count} successful referrals</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Score Adjustment */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity size={16} color="var(--accent-purple-light)" /> Manual Score Adjustment
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                <input className="input-field" placeholder="User ID" value={adjustId} onChange={e => setAdjustId(e.target.value)} style={{ fontSize: 14 }} />
                                <input className="input-field" type="number" placeholder="New referral count" value={adjustVal} onChange={e => setAdjustVal(e.target.value)} style={{ fontSize: 14 }} />
                                <input className="input-field" placeholder="Reason for adjustment" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} style={{ fontSize: 14 }} />
                                <button onClick={handleAdjust} className="btn-primary" style={{ justifyContent: 'center' }}>Apply Adjustment</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div>
                        <input
                            className="input-field"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ marginBottom: 16, maxWidth: 360 }}
                        />
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        {['Name', 'Email', 'Referrals', 'WA Joined', 'Status', 'Registered', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: u.is_banned ? 0.5 : 1 }}>
                                            <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{u.name}</td>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                                            <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: 18, color: 'var(--accent-purple-light)' }}>{u.referral_count}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {u.joined_whatsapp
                                                    ? <span className="badge badge-green">✅ Yes</span>
                                                    : <span className="badge badge-red">❌ No</span>}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {u.is_banned ? <span className="badge badge-red">Banned</span>
                                                    : u.suspicious ? <span className="badge badge-gold">Suspicious</span>
                                                        : <span className="badge badge-green">OK</span>}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {u.is_banned ? (
                                                    <button onClick={() => handleBan(u.id, false)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                                                        <Check size={12} /> Unban
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleBan(u.id, true)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', color: '#ef4444' }}>
                                                        <Ban size={12} /> Ban
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: 14 }}>No users found</p>
                            )}
                        </div>
                    </div>
                )}

                {/* FRAUD TAB */}
                {activeTab === 'fraud' && (
                    <div>
                        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertTriangle size={16} color="#f59e0b" /> Suspicious Users
                            </h3>
                            {filteredUsers.filter(u => u.suspicious || u.is_banned).length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>✅ No suspicious activity detected</p>
                            ) : (
                                filteredUsers.filter(u => u.suspicious || u.is_banned).map(u => (
                                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{u.name} · <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{u.email}</span></p>
                                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.referral_count} referrals · {u.is_banned ? '🚫 Banned' : '⚠️ Suspicious'}</p>
                                        </div>
                                        <button onClick={() => handleBan(u.id, !u.is_banned)} className="btn-secondary" style={{ fontSize: 13, padding: '8px 14px', color: u.is_banned ? '#10b981' : '#ef4444' }}>
                                            {u.is_banned ? '✅ Unban' : '🚫 Ban'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}


            </main>
        </div>
    )
}

'use client'
import { useEffect, useState } from 'react'
import { Trophy, Medal, Crown } from 'lucide-react'

interface LeaderboardEntry {
    id: string
    name: string
    referral_count: number
    rank: number
}

interface LeaderboardProps {
    limit?: number
    currentUserId?: string
    autoRefresh?: boolean
}

const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown size={18} style={{ color: '#f59e0b' }} />
    if (rank === 2) return <Medal size={18} style={{ color: '#9ca3af' }} />
    if (rank === 3) return <Medal size={18} style={{ color: '#b45309' }} />
    return <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', width: 18, textAlign: 'center', display: 'inline-block' }}>{rank}</span>
}

const getRankBg = (rank: number) => {
    if (rank === 1) return 'rgba(245, 158, 11, 0.08)'
    if (rank === 2) return 'rgba(156, 163, 175, 0.06)'
    if (rank === 3) return 'rgba(180, 83, 9, 0.08)'
    return 'transparent'
}

const Avatar = ({ name, rank }: { name: string; rank: number }) => {
    const bg = rank === 1 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
        : rank === 2 ? 'linear-gradient(135deg, #9ca3af, #d1d5db)'
            : rank === 3 ? 'linear-gradient(135deg, #b45309, #d97706)'
                : 'rgba(255,255,255,0.07)'
    const color = rank === 1 || rank === 3 ? '#fff' : rank === 2 ? '#000' : 'var(--text-primary)'
    return (
        <div style={{
            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: 15, background: bg, color, flexShrink: 0
        }}>
            {name.charAt(0).toUpperCase()}
        </div>
    )
}

const LeaderboardRow = ({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) => (
    <div
        key={entry.id}
        className={`lb-row ${isCurrentUser ? 'highlighted' : ''}`}
        style={{ background: isCurrentUser ? undefined : getRankBg(entry.rank) }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <RankIcon rank={entry.rank} />
            </div>
            <Avatar name={entry.name} rank={entry.rank} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.name}
                    </span>
                    {isCurrentUser && <span className="badge badge-purple">You</span>}
                    {entry.rank === 1 && <span className="badge badge-gold">🏆 Leader</span>}
                </div>
            </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: entry.rank <= 3 ? '#f59e0b' : 'var(--accent-purple-light)' }}>
                {entry.referral_count}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>joins</div>
        </div>
    </div>
)

export default function Leaderboard({ limit = 10, currentUserId, autoRefresh = true }: LeaderboardProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null)

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`/api/leaderboard?limit=${limit}`)
            const data = await res.json()
            if (data.entries) {
                const loaded: LeaderboardEntry[] = data.entries
                setEntries(loaded)
                setTotal(data.total || 0)

                // Check if current user is in the loaded entries
                if (currentUserId) {
                    const found = loaded.find(e => e.id === currentUserId)
                    if (found) {
                        // User IS visible in the list — no pinned row needed
                        setUserEntry(null)
                    } else {
                        // User is outside the loaded range — fetch their rank separately
                        const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null
                        if (token) {
                            const rankRes = await fetch('/api/user/me', {
                                headers: { Authorization: `Bearer ${token}` }
                            })
                            const rankData = await rankRes.json()
                            if (rankData.user && rankData.user.rank > 0) {
                                setUserEntry({
                                    id: rankData.user.id,
                                    name: rankData.user.name,
                                    referral_count: rankData.user.referral_count,
                                    rank: rankData.user.rank,
                                })
                            }
                        }
                    }
                }
            }
        } catch {
            // silently ignore
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeaderboard()
        if (autoRefresh) {
            const id = setInterval(fetchLeaderboard, 30000)
            return () => clearInterval(id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit, autoRefresh])

    if (loading) {
        return (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="pulse-glow" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-purple)', margin: '0 auto' }} />
                <p style={{ marginTop: 12, fontSize: 14 }}>Loading leaderboard...</p>
            </div>
        )
    }

    if (!entries.length) {
        return (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Trophy size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Be the first to appear here!</p>
            </div>
        )
    }

    // Check if user is already visible in the top entries
    const userInList = currentUserId && entries.some(e => e.id === currentUserId)
    // Show pinned user row if they're outside the visible list
    const showPinnedUser = currentUserId && !userInList && userEntry && userEntry.rank > 0

    return (
        <div>
            {total > 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', marginBottom: 12 }}>
                    {total.toLocaleString()} participants
                </p>
            )}

            {/* Scrollable entries */}
            <div style={{
                maxHeight: 420,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(124,58,237,0.3) transparent',
            }}>
                {entries.map((entry) => (
                    <LeaderboardRow key={entry.id} entry={entry} isCurrentUser={entry.id === currentUserId} />
                ))}
            </div>

            {/* Pinned "Your Position" row — always visible below the scroll area */}
            {showPinnedUser && userEntry && (
                <>
                    <div style={{
                        textAlign: 'center', padding: '8px 0', color: 'var(--text-secondary)',
                        fontSize: 13, letterSpacing: 2, userSelect: 'none'
                    }}>· · ·</div>
                    <div style={{
                        borderRadius: 10, padding: '6px 0',
                        background: 'rgba(124,58,237,0.06)', border: '1px dashed rgba(124,58,237,0.3)',
                        marginTop: 4,
                    }}>
                        <LeaderboardRow entry={userEntry} isCurrentUser={true} />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 6 }}>
                        📍 Your current position
                    </p>
                </>
            )}
        </div>
    )
}

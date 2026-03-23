'use client'

export default function PrizeDisplay() {
    return (
        <div>
            {/* PRIZE ROW — 3 columns: 2nd | 1st (elevated) | 3rd–10th */}
            <div
                className="prize-row"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 20,
                }}
            >
                {/* 2nd Place — AirPods Pro */}
                <div className="glass-card prize-card" style={{
                    padding: '20px 22px', border: '1px solid rgba(148,163,184,0.3)',
                    maxWidth: 210, width: '100%', textAlign: 'center', borderRadius: 16,
                }}>
                    <img
                        src="/prize-airpods.png"
                        alt="Apple AirPods Pro 3rd Gen"
                        style={{ width: '100%', maxWidth: 160, display: 'block', margin: '0 auto 10px', borderRadius: 10 }}
                    />
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>🥈 2nd Place</div>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>AirPods Pro</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>3rd Generation</div>
                </div>

                {/* 1st Place — iPhone 17e — CENTER & ELEVATED */}
                <div
                    className="glass-card glow-gold float-animation prize-card-gold prize-center"
                    style={{
                        padding: '28px 24px',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(245,158,11,0.45)',
                        maxWidth: 300,
                        width: '100%',
                        textAlign: 'center',
                        borderRadius: 20,
                        transform: 'translateY(-20px)',
                        zIndex: 2,
                    }}
                >
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, transparent 40%, rgba(245,158,11,0.06) 50%, transparent 60%)',
                        pointerEvents: 'none'
                    }} />

                    <span className="badge badge-gold" style={{ fontSize: 11, padding: '4px 12px', marginBottom: 10, display: 'inline-block' }}>
                        🏆 1st Place · Top Referrer
                    </span>

                    <img
                        src="/prize-iphone.png"
                        alt="iPhone 17e"
                        style={{ width: '100%', maxWidth: 200, display: 'block', margin: '8px auto 12px', borderRadius: 14 }}
                    />

                    <div className="gradient-text-gold" style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>
                        iPhone 17e
                    </div>
                </div>

                {/* 3rd–10th Place — ₹1000 Voucher */}
                <div className="glass-card prize-card" style={{
                    padding: '20px 22px', border: '1px solid rgba(180,83,9,0.3)',
                    maxWidth: 210, width: '100%', textAlign: 'center', borderRadius: 16,
                }}>
                    <img
                        src="/prize-amazon-1000.png"
                        alt="₹1000 Amazon Gift Voucher"
                        style={{ width: '100%', maxWidth: 160, display: 'block', margin: '0 auto 10px', borderRadius: 10 }}
                    />
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>🥉 3rd – 10th Place</div>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>Amazon Gift Voucher</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>₹1,000 each</div>
                </div>
            </div>

            {/* 11th–20th Place — ₹200 Voucher Row */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div className="glass-card prize-card" style={{
                    padding: '16px 28px', border: '1px solid rgba(251,146,60,0.2)',
                    maxWidth: 460, width: '100%', display: 'flex', alignItems: 'center', gap: 16, borderRadius: 14, flexWrap: 'wrap',
                }}>
                    <img
                        src="/prize-amazon-200.png"
                        alt="₹200 Amazon Gift Voucher"
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#fb923c', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>🎖️ 11th – 20th Place</div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>Amazon Gift Voucher · <span style={{ color: '#fb923c' }}>₹200 each</span></div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>10 vouchers · One for each finisher</div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                {[
                    { icon: '🤖', text: 'Best AI Community' },
                    { icon: '💡', text: 'Daily AI Tips' },
                ].map(({ icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                        <span>{icon}</span>
                        <span>{text}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

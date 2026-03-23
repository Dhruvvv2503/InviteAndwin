'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import CountdownTimer from '@/components/CountdownTimer'
import Leaderboard from '@/components/Leaderboard'
import PrizeDisplay from '@/components/PrizeDisplay'
import { ArrowRight, Zap, Users, Trophy, QrCode } from 'lucide-react'

const WHATSAPP_LINK = process.env.NEXT_PUBLIC_WHATSAPP_JOIN_LINK || 'https://chat.whatsapp.com/PLACEHOLDER'

export default function HomePage() {
  const [totalJoins, setTotalJoins] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/leaderboard?limit=10')
      .then(r => r.json())
      .then(d => { if (d.total) setTotalJoins(d.total) })
      .catch(() => { })
  }, [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Win iPhone 17e — Team Google AI WhatsApp Channel Referral Contest',
    description: 'Join the Team Google AI WhatsApp Channel and invite friends to win an iPhone 17e. Top 20 referrers win prizes.',
    url: 'https://inviteandwin.online',
    organizer: { '@type': 'Organization', name: 'InviteAndWin', url: 'https://inviteandwin.online' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: 'https://inviteandwin.online/register' },
    location: { '@type': 'VirtualLocation', url: 'https://inviteandwin.online' },
  }

  return (
    <div className="hero-bg" style={{ minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* NAV */}
      <nav style={{
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
          }}>🤖</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>AI<span style={{ color: 'var(--accent-purple-light)' }}>Referral</span></span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/leaderboard" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 14 }}>
            <Trophy size={14} /> Leaderboard
          </Link>
          <Link href="/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>
            Join Contest
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        {/* HERO */}
        <section style={{ textAlign: 'center', padding: 'clamp(40px, 8vw, 80px) 0 60px' }} className="slide-up">
          {totalJoins && (
            <div style={{ marginBottom: 24 }}>
              <span className="badge badge-green" style={{ fontSize: 13, padding: '6px 16px' }}>
                🔥 {totalJoins.toLocaleString()} people have joined
              </span>
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            Invite Friends.{' '}
            <span className="gradient-text">Top Inviter</span>
            <br />Wins an iPhone 17e.
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 20px)', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Join the official <strong style={{ color: 'var(--text-primary)' }}>Team Google AI WhatsApp Channel</strong> — daily AI tips, tools &amp; breakthroughs. Invite your network and climb to the top.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/register" className="btn-primary hero-cta" style={{ fontSize: 17, padding: '16px 32px' }}>
              Join the Competition <ArrowRight size={18} />
            </Link>
          </div>
          <CountdownTimer />
        </section>

        {/* PRIZE */}
        <section style={{ padding: '40px 0 60px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-secondary)', marginBottom: 24, fontWeight: 600 }}>
            🏆 Contest Prize
          </p>
          <PrizeDisplay />
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: '0 0 60px' }}>
          {/* MANDATORY RULES BANNER */}
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 14, padding: '20px 28px', marginBottom: 48,
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 26 }}>⚠️</span>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#f87171' }}>
              Mandatory: You must join the WhatsApp channel first
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, maxWidth: 620 }}>
              Only registrations <strong style={{ color: 'var(--text-primary)' }}>via the QR code into the Team Google AI WhatsApp Channel</strong> are counted.
              Our system runs a <strong style={{ color: 'var(--text-primary)' }}>daily verification</strong> — if your registered phone number is not found active in the channel, you will be <strong style={{ color: '#f87171' }}>automatically disqualified</strong>.
            </p>
          </div>

          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>How It Works</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 40 }}>Three simple steps to win</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: <Zap size={28} color="#7c3aed" />, step: '01', title: 'Join the Channel', desc: 'Scan the QR code below to join the Team Google AI WhatsApp Channel.' },
              { icon: <Users size={28} color="#3b82f6" />, step: '02', title: 'Register & Get Your Link', desc: 'Sign up and get your unique referral link that tracks every person you invite.' },
              { icon: <Trophy size={28} color="#f59e0b" />, step: '03', title: 'Invite & Win', desc: 'Share your link everywhere. Top referrer wins an iPhone 17e + 19 more prizes up for grabs!' },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="glass-card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 44, fontWeight: 900, color: 'rgba(255,255,255,0.05)' }}>{step}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* QR CODE */}
        <section id="qr-section" style={{ padding: '40px 0 60px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Join the Channel</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16 }}>
            Scan the QR code or tap the button to join the Team Google AI WhatsApp Channel
          </p>
          <div className="glass-card glow-green" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: 24, gap: 16 }}>
            <div style={{
              width: 240, height: 240, borderRadius: 16, overflow: 'hidden', flexShrink: 0,
              border: '2px solid rgba(37, 211, 102, 0.45)',
              boxShadow: '0 0 18px rgba(37, 211, 102, 0.25), 0 0 40px rgba(37, 211, 102, 0.1)',
            }}>
              <img
                src="/whatsapp-qr.jpg"
                alt="WhatsApp Community QR Code"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
              />
            </div>
            <a
              href="https://bit.ly/3MPdd0g?r=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{ width: '100%', maxWidth: 240 }}
              onClick={() => fetch('/api/whatsapp/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refCode: null }) })}
            >
              💬 Join Team Google AI Channel
            </a>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 16 }}>
            <Link href="/register" style={{ color: 'var(--accent-purple-light)', fontWeight: 600 }}>
              Register now to compete →
            </Link>
          </p>
        </section>

        {/* LEADERBOARD PREVIEW */}
        <section style={{ padding: '40px 0 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 800 }}>Live Leaderboard</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Refreshes every 30 seconds</p>
            </div>
            <Link href="/leaderboard" className="btn-secondary">
              View Full Leaderboard <ArrowRight size={16} />
            </Link>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
            <Leaderboard limit={10} autoRefresh />
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/register" className="btn-primary" style={{ fontSize: 17, padding: '16px 36px' }}>
              🚀 Start Competing — Register Free <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        <p>© 2026 Team Google AI WhatsApp Channel Contest · Not affiliated with Google</p>
        <p style={{ marginTop: 6 }}>
          <Link href="/leaderboard" style={{ color: 'var(--accent-purple-light)' }}>Leaderboard</Link>
          {' · '}
          <Link href="/register" style={{ color: 'var(--accent-purple-light)' }}>Register</Link>
          {' · '}
          <a href="mailto:hello.inviteandwin@gmail.com" style={{ color: 'var(--accent-purple-light)' }}>Support</a>
        </p>
      </footer>
    </div>
  )
}

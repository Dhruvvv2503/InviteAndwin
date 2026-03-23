'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, Check } from 'lucide-react'

interface ShareButtonsProps {
    referralLink: string
    referralCode: string
}

// WhatsApp referral message
const WHATSAPP_MESSAGE = (link: string) =>
    `Hey! 👋

I recently joined a WhatsApp channel where the *Google AI team shares daily AI tricks, prompt engineering tips, and updates about tools like Gemini and Google AI Studio.*

It's actually quite useful if you're interested in learning more about AI.

To grow the community, they're running a *referral challenge*.

🏆 1st Prize: iPhone 17e
🎧 Other rewards for top inviters including Apple AirPods Pro and Amazon Vouchers

If you want to check out the channel, you can join here:

${link}

Even if you're not interested in the contest, the *daily AI tips are genuinely useful.*`

const TELEGRAM_MESSAGE = (link: string) =>
    `🔥 Just joined the best AI community on WhatsApp! Google AI Studio Community is dropping 🤖 insights, tools & breakthroughs daily. Join via: ${link}`

export default function ShareButtons({ referralLink, referralCode }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink)
            setCopied(true)
            toast.success('Link copied!')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Could not copy link')
        }
    }

    const shareWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE(referralLink))}`
        window.open(url, '_blank')
    }

    const shareTelegram = () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(TELEGRAM_MESSAGE(referralLink))}`
        window.open(url, '_blank')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Share buttons row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={shareWhatsApp} className="btn-whatsapp" style={{ flex: 1, minWidth: 160 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                    </svg>
                    Share on WhatsApp
                </button>

                <button onClick={shareTelegram} className="btn-secondary" style={{ flex: 1, minWidth: 140 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#229ED9' }}>
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.18 13.434l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.641.952z" />
                    </svg>
                    Telegram
                </button>

                <button onClick={handleCopy} className="btn-secondary" style={{ flexShrink: 0 }}>
                    {copied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>

            {/* Link preview */}
            <div
                className="glass-card"
                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                onClick={handleCopy}
            >
                <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {referralLink}
                </div>
                <Copy size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            </div>

            {/* Prewritten message preview */}
            <div className="glass-card" style={{ padding: 16 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                    📋 Prewritten Message
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {WHATSAPP_MESSAGE(referralLink).substring(0, 180)}...
                </p>
                <button
                    onClick={async () => {
                        await navigator.clipboard.writeText(WHATSAPP_MESSAGE(referralLink))
                        toast.success('Message copied!')
                    }}
                    style={{ marginTop: 10, fontSize: 12, color: 'var(--accent-purple-light)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                    Copy full message →
                </button>
            </div>
        </div>
    )
}

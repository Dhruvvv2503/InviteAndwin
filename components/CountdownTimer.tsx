'use client'
import { useState, useEffect } from 'react'

interface TimeLeft {
    days: number
    hours: number
    minutes: number
    seconds: number
}

export default function CountdownTimer() {
    const contestEnd = (process.env.NEXT_PUBLIC_CONTEST_END_DATE || '2026-04-10T23:59:59+05:30').trim()
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const calculate = () => {
            const end = new Date(contestEnd).getTime()
            const now = Date.now()
            const diff = isNaN(end) ? 0 : Math.max(0, end - now)
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            })
        }
        calculate()
        const id = setInterval(calculate, 1000)
        return () => clearInterval(id)
    }, [contestEnd])

    if (!mounted) return null

    return (
        <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
                ⏰ Contest Ends In
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                    { value: timeLeft.days, label: 'Days' },
                    { value: timeLeft.hours, label: 'Hours' },
                    { value: timeLeft.minutes, label: 'Minutes' },
                    { value: timeLeft.seconds, label: 'Seconds' },
                ].map(({ value, label }) => (
                    <div
                        key={label}
                        className="glass-card countdown-box"
                        style={{ padding: '14px 18px', minWidth: 70, textAlign: 'center' }}
                    >
                        <div className="countdown-value" style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>
                            {String(value).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
                            {label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

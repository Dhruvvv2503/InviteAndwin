'use client'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Download } from 'lucide-react'

interface QRCodeCardProps {
    value: string
    label?: string
    size?: number
}

export default function QRCodeCard({ value, label = 'Your Referral QR Code', size = 160 }: QRCodeCardProps) {
    const [downloading, setDownloading] = useState(false)

    const handleDownload = () => {
        setDownloading(true)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = size + 48
        canvas.height = size + 48

        const svgEl = document.querySelector('#qr-svg') as SVGElement
        if (!svgEl || !ctx) { setDownloading(false); return }

        const svgData = new XMLSerializer().serializeToString(svgEl)
        const img = new Image()
        img.onload = () => {
            if (!ctx) return
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 24, 24, size, size)
            const a = document.createElement('a')
            a.download = 'my-referral-qr.png'
            a.href = canvas.toDataURL('image/png')
            a.click()
            setDownloading(false)
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }

    return (
        <div className="glass-card" style={{ padding: 24, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                {label}
            </p>
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 0 30px rgba(124,58,237,0.2)'
                }}
            >
                <QRCodeSVG
                    id="qr-svg"
                    value={value}
                    size={size}
                    level="H"
                    fgColor="#0a0a0f"
                    bgColor="#ffffff"
                />
            </div>
            <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-secondary"
                style={{ fontSize: 13, padding: '8px 16px' }}
            >
                <Download size={14} />
                {downloading ? 'Downloading...' : 'Download QR'}
            </button>
        </div>
    )
}

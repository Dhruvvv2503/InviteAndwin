import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const refCode = (body.refCode || '').toUpperCase() || null
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

        // IP dedup: one click per IP per 24 hours (prevent spam)
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: existing } = await supabaseAdmin
            .from('whatsapp_clicks')
            .select('id')
            .eq('ip_address', ip)
            .gte('created_at', since24h)
            .limit(1)
            .single()

        if (existing) {
            // Already counted today — return success silently
            return NextResponse.json({ success: true, alreadyCounted: true })
        }

        // Record the click
        const { error } = await supabaseAdmin.from('whatsapp_clicks').insert({
            ip_address: ip,
            ref_code: refCode || null,
        })

        if (error) {
            console.error('[WhatsApp click] Insert error:', JSON.stringify(error))
            return NextResponse.json({ error: 'Failed to record' }, { status: 500 })
        }

        console.log(`[WhatsApp click] ✅ IP:${ip} refCode:${refCode || 'none'}`)
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[WhatsApp click] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

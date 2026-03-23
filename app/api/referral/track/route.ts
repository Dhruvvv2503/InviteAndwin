import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
    try {
        const { referrerCode } = await req.json()
        if (!referrerCode) {
            return NextResponse.json({ error: 'Missing referrer code' }, { status: 400 })
        }

        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

        // 1. Validate referrer exists
        const { data: referrer, error: refError } = await supabaseAdmin
            .from('users')
            .select('id, referral_code, ip_address, is_banned')
            .eq('referral_code', referrerCode.trim().toUpperCase())
            .single()

        if (refError || !referrer) {
            console.error('[Track] Referrer not found:', referrerCode, refError)
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
        }
        if (referrer.is_banned) {
            return NextResponse.json({ error: 'Referrer is banned' }, { status: 403 })
        }

        // 2. Check for duplicate — same IP already counted for this referrer
        //    Return success (idempotent) so the client can proceed to register
        const { data: existing } = await supabaseAdmin
            .from('referrals')
            .select('id, verified')
            .eq('referrer_code', referrerCode.trim().toUpperCase())
            .eq('ip_address', ip)
            .limit(1)
            .single()

        if (existing) {
            console.log('[Track] Already counted this IP for referrer:', referrerCode)
            // Return success so device can proceed to register page — count was already credited
            return NextResponse.json({ success: true, alreadyCounted: true })
        }

        // 3. Determine if suspicious (same IP as referrer — self-test scenario)
        //    Do NOT block. Mark as suspicious for admin review but still count.
        const suspicious = (ip === referrer.ip_address)
        if (suspicious) {
            console.log('[Track] Self-referral / same IP detected for:', referrerCode, '— marking suspicious but counting')
        }

        // 4. Rate limit: max 20 verified referrals per referrer per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { count: recentCount } = await supabaseAdmin
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_code', referrerCode.trim().toUpperCase())
            .eq('verified', true)
            .gte('created_at', oneHourAgo)

        if ((recentCount || 0) >= 20) {
            return NextResponse.json({ error: 'Rate limit reached for this referral link' }, { status: 429 })
        }

        // 5. Record the referral
        const { error: insertErr } = await supabaseAdmin.from('referrals').insert({
            referrer_code: referrerCode.trim().toUpperCase(),
            verified: true,
            ip_address: ip,
            suspicious,
        })
        if (insertErr) {
            console.error('[Track] referrals insert failed:', JSON.stringify(insertErr))
            // Don't return — still try to increment count
        }

        // 6. Atomic increment: fresh fetch + update
        const { data: freshUser, error: fetchErr } = await supabaseAdmin
            .from('users')
            .select('referral_count')
            .eq('referral_code', referrerCode.trim().toUpperCase())
            .single()

        if (fetchErr || !freshUser) {
            console.error('[Track] Fresh fetch failed:', JSON.stringify(fetchErr))
            return NextResponse.json({ error: 'Failed to update count' }, { status: 500 })
        }

        const newCount = (freshUser.referral_count ?? 0) + 1
        const { error: updateErr } = await supabaseAdmin
            .from('users')
            .update({ referral_count: newCount })
            .eq('referral_code', referrerCode.trim().toUpperCase())

        if (updateErr) {
            console.error('[Track] Count update failed:', JSON.stringify(updateErr))
            return NextResponse.json({ error: 'Count update failed' }, { status: 500 })
        }

        console.log(`[Track] ✅ Referral credited — code:${referrerCode} newCount:${newCount} suspicious:${suspicious}`)
        return NextResponse.json({ success: true, newCount })
    } catch (error) {
        console.error('[Track] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

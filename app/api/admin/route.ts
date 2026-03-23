import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

// Marker: all seeded decoy users have this email suffix — no extra DB column needed
const SEED_DOMAIN = '@seeded.fake'

function checkSecret(req: NextRequest): boolean {
    const secret = req.nextUrl.searchParams.get('secret') || ''
    return secret === ADMIN_SECRET
}

export async function GET(req: NextRequest) {
    if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // All real-user queries exclude @seeded.fake email domain
    const [
        { count: totalRegistrations },
        { count: totalWhatsappJoins },
        { count: totalReferrals },
        { count: newToday },
        { count: newThisWeek },
        { count: suspiciousCount },
        { count: bannedCount },
        { count: seededDecoys },
        { count: totalWhatsappClicks },
        { data: topReferrerData },
        { data: users },
    ] = await Promise.all([
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).not('email', 'like', `%${SEED_DOMAIN}`),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).not('email', 'like', `%${SEED_DOMAIN}`).eq('joined_whatsapp', true),
        supabaseAdmin.from('referrals').select('*', { count: 'exact', head: true }).eq('verified', true),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).not('email', 'like', `%${SEED_DOMAIN}`).gte('created_at', todayStart),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).not('email', 'like', `%${SEED_DOMAIN}`).gte('created_at', weekStart),
        supabaseAdmin.from('referrals').select('*', { count: 'exact', head: true }).eq('suspicious', true),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).not('email', 'like', `%${SEED_DOMAIN}`).eq('is_banned', true),
        // Count decoys for admin callout only
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).like('email', `%${SEED_DOMAIN}`),
        // Total WhatsApp button clicks (all pages, IP-deduped)
        supabaseAdmin.from('whatsapp_clicks').select('*', { count: 'exact', head: true }),
        // Top referrer: real users only
        supabaseAdmin.from('users').select('name, referral_count').not('email', 'like', `%${SEED_DOMAIN}`).eq('is_banned', false).order('referral_count', { ascending: false }).limit(1),
        // User list: real users only
        supabaseAdmin.from('users').select('id, name, email, referral_count, joined_whatsapp, is_banned, created_at').not('email', 'like', `%${SEED_DOMAIN}`).order('referral_count', { ascending: false }).limit(500),
    ])

    const conversionRate = totalRegistrations
        ? Math.round(((totalWhatsappJoins || 0) / (totalRegistrations || 1)) * 100)
        : 0

    const { data: suspiciousUserCodes } = await supabaseAdmin
        .from('referrals')
        .select('referrer_code')
        .eq('suspicious', true)

    const suspCodes = new Set((suspiciousUserCodes || []).map(r => r.referrer_code))

    const enrichedUsers = (users || []).map(u => ({
        ...u,
        suspicious: suspCodes.has(u.id)
    }))

    return NextResponse.json({
        stats: {
            totalRegistrations: totalRegistrations || 0,
            totalWhatsappJoins: totalWhatsappClicks || 0,   // all clicks from any page
            totalReferrals: totalReferrals || 0,
            conversionRate,
            newToday: newToday || 0,
            newThisWeek: newThisWeek || 0,
            suspiciousCount: suspiciousCount || 0,
            bannedCount: bannedCount || 0,
            topReferrer: topReferrerData?.[0] || null,
            seededDecoys: seededDecoys || 0,
        },
        users: enrichedUsers,
    })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function getUserIdFromToken(req: NextRequest): string | null {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    try {
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string }
        return decoded.userId
    } catch {
        return null
    }
}

export async function GET(req: NextRequest) {
    const userId = getUserIdFromToken(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, referral_code, referral_count, joined_whatsapp, created_at')
        .eq('id', userId)
        .single()

    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Rank = users with MORE referrals + users with SAME referrals who joined EARLIER + 1
    // This matches leaderboard sort: referral_count DESC, created_at ASC
    const { count: higherCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_banned', false)
        .gt('referral_count', user.referral_count)

    const { count: tiedEarlierCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_banned', false)
        .eq('referral_count', user.referral_count)
        .lt('created_at', user.created_at)

    const rank = (higherCount || 0) + (tiedEarlierCount || 0) + 1

    const { count: totalParticipants } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_banned', false)

    return NextResponse.json({ user: { ...user, rank }, totalParticipants: totalParticipants || 0 })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { bustCache } from '@/app/api/leaderboard/route'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

export async function POST(req: NextRequest) {
    const { userId, ban, secret } = await req.json()
    if (secret !== ADMIN_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    await supabaseAdmin.from('users').update({ is_banned: ban }).eq('id', userId)
    // Bust leaderboard cache so banned user disappears immediately
    bustCache()
    // Log the action
    await supabaseAdmin.from('admin_logs').insert({
        action: ban ? 'ban' : 'unban',
        target_user_id: userId,
        performed_at: new Date().toISOString(),
    })
    return NextResponse.json({ success: true })
}

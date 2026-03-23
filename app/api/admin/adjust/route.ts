import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

export async function POST(req: NextRequest) {
    const { userId, newCount, reason, secret } = await req.json()
    if (secret !== ADMIN_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!userId || newCount === undefined || !reason) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    await supabaseAdmin.from('users').update({ referral_count: newCount }).eq('id', userId)
    // Log the adjustment
    await supabaseAdmin.from('admin_logs').insert({
        action: 'score_adjust',
        target_user_id: userId,
        reason,
        new_value: newCount,
        performed_at: new Date().toISOString(),
    })
    return NextResponse.json({ success: true })
}

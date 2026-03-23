import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'Missing referral code' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('users')
        .select('name, referral_count')
        .eq('referral_code', code)
        .single()

    if (error || !data) return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
    return NextResponse.json({ name: data.name, referral_count: data.referral_count })
}

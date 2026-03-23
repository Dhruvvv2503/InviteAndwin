import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Cache leaderboard in memory for 60s to reduce DB reads
export let cache: { data: unknown; at: number } | null = null
export function bustCache() { cache = null }

export async function GET(req: NextRequest) {
    try {
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10')

        // Return cache if fresh (< 60s)
        if (cache && Date.now() - cache.at < 60000) {
            const d = cache.data as { entries: unknown[]; total: number }
            return NextResponse.json({ entries: d.entries.slice(0, limit), total: d.total })
        }

        // Fetch ALL users (real + seeded decoys) for public leaderboard
        // is_seeded users look identical to real users to visitors
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, name, referral_count, created_at')
            .eq('is_banned', false)
            .order('referral_count', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(500)

        if (error) return NextResponse.json({ entries: [], total: 0 })

        // Total participant count = real + seeded (everyone sees a lively count)
        const { count: total } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_banned', false)

        const entries = (data || []).map((u, i) => ({
            id: u.id,
            name: u.name,
            referral_count: u.referral_count,
            rank: i + 1,
        }))

        cache = { data: { entries, total: total || 0 }, at: Date.now() }

        return NextResponse.json({ entries: entries.slice(0, limit), total: total || 0 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ entries: [], total: 0 })
    }
}

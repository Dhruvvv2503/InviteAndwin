import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function POST(req: NextRequest) {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string }
        await supabaseAdmin
            .from('users')
            .update({ joined_whatsapp: true })
            .eq('id', decoded.userId)
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
}

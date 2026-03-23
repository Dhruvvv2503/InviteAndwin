import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import jwt from 'jsonwebtoken'

function toTenDigit(phone: string): string {
    let p = phone.replace(/[\s\-().+]/g, '')
    if (p.startsWith('91') && p.length === 12) p = p.slice(2)
    if (p.startsWith('0') && p.length === 11) p = p.slice(1)
    return p
}

export async function POST(req: NextRequest) {
    try {
        const { phone, otp, mode } = await req.json()
        // mode: 'login' (returns JWT) | 'register' (just confirms phone, returns verified token)
        if (!phone || !otp) {
            return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 })
        }

        const normalizedPhone = toTenDigit(phone.trim())
        const trimmedOTP = otp.trim()


        // Fetch the latest valid OTP for this phone
        const { data: otpRows, error } = await supabaseAdmin
            .from('otp_requests')
            .select('id, otp, expires_at, used, user_id')
            .eq('phone', normalizedPhone)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)

        if (error || !otpRows || otpRows.length === 0) {
            return NextResponse.json(
                { error: 'Invalid or expired OTP. Please request a new one.' },
                { status: 400 }
            )
        }

        const record = otpRows[0]
        if (record.otp !== trimmedOTP) {
            return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 401 })
        }

        // Mark OTP as used
        await supabaseAdmin.from('otp_requests').update({ used: true }).eq('id', record.id)

        if (mode === 'register') {
            // For registration: OTP verified but account doesn't exist yet.
            // Return a short-lived "phone verified" token the register API will validate.
            const verifiedToken = jwt.sign(
                { verifiedPhone: normalizedPhone, purpose: 'registration' },
                process.env.JWT_SECRET || 'dev-secret',
                { expiresIn: '15m' }  // 15 minutes to complete registration
            )
            return NextResponse.json({ success: true, verifiedToken })
        }

        // mode: 'login' — fetch user and return full auth JWT
        if (!record.user_id) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 })
        }

        const { data: user, error: userErr } = await supabaseAdmin
            .from('users')
            .select('id, name, is_banned')
            .eq('id', record.user_id)
            .single()

        if (userErr || !user) {
            return NextResponse.json({ error: 'User account not found.' }, { status: 404 })
        }
        if (user.is_banned) {
            return NextResponse.json({ error: 'This account has been banned.' }, { status: 403 })
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '30d' }
        )
        return NextResponse.json({ token, userId: user.id })
    } catch (err) {
        console.error('OTP verify error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

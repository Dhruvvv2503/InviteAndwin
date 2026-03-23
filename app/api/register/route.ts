import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { nanoid } from 'nanoid'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Normalize any phone input to plain 10-digit number
function toTenDigit(phone: string): string {
    let p = phone.replace(/[\s\-().+]/g, '')
    if (p.startsWith('91') && p.length === 12) p = p.slice(2)
    if (p.startsWith('0') && p.length === 11) p = p.slice(1)
    return p
}


export async function POST(req: NextRequest) {
    try {
        const { name, email, phone, password, referredBy, verifiedToken } = await req.json()
        if (!name || !email || !phone || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }

        // ── Phone OTP verification required ──
        if (!verifiedToken) {
            return NextResponse.json(
                { error: 'Phone number not verified. Please verify your phone with OTP first.' },
                { status: 400 }
            )
        }
        // Validate the phone-verified token
        let verifiedPhone: string
        try {
            const decoded = jwt.verify(verifiedToken, process.env.JWT_SECRET || 'dev-secret') as {
                verifiedPhone: string
                purpose: string
            }
            if (decoded.purpose !== 'registration') throw new Error('Invalid token purpose')
            verifiedPhone = decoded.verifiedPhone
        } catch {
            return NextResponse.json(
                { error: 'Phone verification expired or invalid. Please verify again.' },
                { status: 400 }
            )
        }

        // Make sure the phone in the form matches what was verified
        const submittedPhone = toTenDigit(phone.trim())
        if (verifiedPhone !== submittedPhone) {
            return NextResponse.json(
                { error: 'Phone number does not match verified number. Please re-verify.' },
                { status: 400 }
            )
        }

        const emailKey = email.toLowerCase().trim()
        const ip = req.headers.get('x-forwarded-for') || 'unknown'

        // Check if email already registered
        const { data: existing } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', emailKey)
            .single()
        if (existing) {
            return NextResponse.json({ error: 'This email is already registered. Please log in.' }, { status: 409 })
        }

        // Validate referral code
        let referrerId: string | null = null
        let referrerCurrentCount = 0
        if (referredBy) {
            const { data: referrer } = await supabaseAdmin
                .from('users')
                .select('id, referral_count')
                .eq('referral_code', referredBy.trim().toUpperCase())
                .single()
            if (referrer) {
                referrerId = referrer.id
                referrerCurrentCount = referrer.referral_count || 0
            }
        }

        const userId = crypto.randomUUID()
        const referralCode = nanoid(8).toUpperCase()
        const passwordHash = await bcrypt.hash(password, 10)

        const { error: insertError } = await supabaseAdmin.from('users').insert({
            id: userId,
            name: name.trim(),
            email: emailKey,
            phone: verifiedPhone,  // always use the OTP-verified, normalized phone
            password_hash: passwordHash,
            referral_code: referralCode,
            referred_by: referredBy ? referredBy.trim().toUpperCase() : null,
            referral_count: 0,
            joined_whatsapp: false,
            is_banned: false,
            ip_address: ip,
        })

        if (insertError) {
            console.error('[Insert error]', insertError)
            return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
        }

        // Note: referred_by is stored above on the user record for attribution.
        // referral_count is ONLY incremented by /api/referral/track (on WhatsApp join confirmation).
        // Do NOT increment here — that would double-count people who go through the join page.

        const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '30d' })
        return NextResponse.json({ token, userId, referralCode })
    } catch (error) {
        console.error('[Register error]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

function maskEmail(email: string): string {
    const [user, domain] = email.split('@')
    const masked = user.slice(0, 2) + '***' + user.slice(-1)
    return `${masked}@${domain}`
}

function toTenDigit(phone: string): string {
    let p = phone.replace(/[\s\-().+]/g, '')
    if (p.startsWith('91') && p.length === 12) p = p.slice(2)
    if (p.startsWith('0') && p.length === 11) p = p.slice(1)
    return p
}

async function sendEmailOTP(toEmail: string, otp: string, name: string) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    })
    await transporter.sendMail({
        from: `"InviteAndWin 🏆" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Your Login OTP: ${otp} — InviteAndWin`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#13131f;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:32px 32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">InviteAndWin 🏆</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Google AI Studio Community Contest</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#a0a0b8;font-size:15px;margin:0 0 20px;">Hi <strong style="color:#f0f0ff">${name}</strong>,</p>
      <p style="color:#a0a0b8;font-size:15px;margin:0 0 28px;line-height:1.6;">Your login verification code is:</p>
      <div style="background:#1a1a28;border:1px solid rgba(124,58,237,0.4);border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
        <span style="font-size:44px;font-weight:900;letter-spacing:12px;color:#fff;font-family:monospace;">${otp}</span>
      </div>
      <p style="color:#a0a0b8;font-size:13px;margin:0;line-height:1.6;">
        ⏱ Expires in <strong style="color:#f0f0ff">10 minutes</strong>.<br>
        🔒 Never share this code with anyone.
      </p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="color:#555570;font-size:12px;margin:0;">If you didn't request this, ignore this email.<br>
      © 2026 InviteAndWin · <a href="mailto:hello.inviteandwin@gmail.com" style="color:#7c3aed;text-decoration:none;">hello.inviteandwin@gmail.com</a></p>
    </div>
  </div>
</body>
</html>`,
    })
}

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const emailKey = email.toLowerCase().trim()

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, name, phone, email, password_hash, is_banned')
            .eq('email', emailKey)
            .single()

        if (error || !user) {
            return NextResponse.json({ error: 'No account found with this email' }, { status: 404 })
        }
        if (user.is_banned) {
            return NextResponse.json({ error: 'This account has been banned' }, { status: 403 })
        }
        if (!user.password_hash) {
            return NextResponse.json({ error: 'This account was created without a password. Please contact support at hello.inviteandwin@gmail.com' }, { status: 400 })
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash)
        if (!passwordMatch) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
        }

        // Normalize stored phone for OTP record
        const phone10 = user.phone ? toTenDigit(user.phone) : user.id  // fallback to userId as key if no phone

        // Rate limit: max 3 OTPs per 10 min
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const { count } = await supabaseAdmin
            .from('otp_requests')
            .select('*', { count: 'exact', head: true })
            .eq('phone', phone10)
            .gte('created_at', tenMinAgo)

        if ((count ?? 0) >= 3) {
            return NextResponse.json({ error: 'Too many OTP requests. Please wait 10 minutes.' }, { status: 429 })
        }

        // Invalidate old OTPs
        await supabaseAdmin.from('otp_requests').update({ used: true }).eq('phone', phone10).eq('used', false)

        const otp = generateOTP()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

        await supabaseAdmin.from('otp_requests').insert({
            phone: phone10,
            otp,
            expires_at: expiresAt,
            used: false,
            user_id: user.id,
        })

        // Send OTP to their registered email
        await sendEmailOTP(user.email, otp, user.name)

        return NextResponse.json({
            requiresOTP: true,
            phone: phone10,
            maskedEmail: maskEmail(user.email),
        })
    } catch (error) {
        console.error('[Login error]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

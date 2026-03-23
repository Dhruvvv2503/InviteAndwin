import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import nodemailer from 'nodemailer'

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

function toTenDigit(phone: string): string {
    let p = phone.replace(/[\s\-().+]/g, '')
    if (p.startsWith('91') && p.length === 12) p = p.slice(2)
    if (p.startsWith('0') && p.length === 11) p = p.slice(1)
    return p
}

function maskEmail(email: string): string {
    const [user, domain] = email.split('@')
    const masked = user.slice(0, 2) + '***' + user.slice(-1)
    return `${masked}@${domain}`
}

// Create Gmail transporter
function getTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    })
}

async function sendEmailOTP(toEmail: string, otp: string, name?: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const transporter = getTransporter()
        await transporter.sendMail({
            from: `"InviteAndWin 🏆" <${process.env.GMAIL_USER}>`,
            to: toEmail,
            subject: `Your OTP: ${otp} — InviteAndWin`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#13131f;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:32px 32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">InviteAndWin 🏆</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Google AI Studio Community Contest</p>
    </div>
    <!-- Body -->
    <div style="padding:36px 32px;">
      ${name ? `<p style="color:#a0a0b8;font-size:15px;margin:0 0 20px;">Hi <strong style="color:#f0f0ff">${name}</strong>,</p>` : ''}
      <p style="color:#a0a0b8;font-size:15px;margin:0 0 28px;line-height:1.6;">
        Your one-time verification code is:
      </p>
      <!-- OTP Box -->
      <div style="background:#1a1a28;border:1px solid rgba(124,58,237,0.4);border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
        <span style="font-size:44px;font-weight:900;letter-spacing:12px;color:#fff;font-family:monospace;">${otp}</span>
      </div>
      <p style="color:#a0a0b8;font-size:13px;margin:0;line-height:1.6;">
        ⏱ This code expires in <strong style="color:#f0f0ff">10 minutes</strong>.<br>
        🔒 Never share this code with anyone.
      </p>
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="color:#555570;font-size:12px;margin:0;">
        If you didn't request this, ignore this email.<br>
        © 2026 InviteAndWin · <a href="mailto:hello.inviteandwin@gmail.com" style="color:#7c3aed;text-decoration:none;">hello.inviteandwin@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>`,
        })
        return { ok: true }
    } catch (err) {
        console.error('[Email OTP error]', err)
        return { ok: false, error: String(err) }
    }
}

async function createAndSendOTP(phone10: string, toEmail: string, userId: string | null, name?: string) {
    // Rate limit: max 3 OTPs per phone per 10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
        .from('otp_requests')
        .select('*', { count: 'exact', head: true })
        .eq('phone', phone10)
        .gte('created_at', tenMinAgo)

    if ((count ?? 0) >= 3) {
        return { error: 'Too many OTP requests. Please wait 10 minutes before trying again.', status: 429 }
    }

    // Invalidate old OTPs for this phone
    await supabaseAdmin.from('otp_requests').update({ used: true }).eq('phone', phone10).eq('used', false)

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertErr } = await supabaseAdmin.from('otp_requests').insert({
        phone: phone10,
        otp,
        expires_at: expiresAt,
        used: false,
        user_id: userId,
    })
    if (insertErr) {
        console.error('OTP insert error:', insertErr)
        return { error: 'Failed to generate OTP. Please try again.', status: 500 }
    }

    const result = await sendEmailOTP(toEmail, otp, name)
    if (!result.ok) {
        return { error: 'Failed to send OTP email. Please try again.', status: 502 }
    }

    return { success: true, maskedEmail: maskEmail(toEmail) }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        const mode = body.mode || 'login'
        const phone = (body.phone || '').trim()
        if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })

        const phone10 = toTenDigit(phone)
        if (phone10.length !== 10 || !/^\d{10}$/.test(phone10)) {
            return NextResponse.json({ error: 'Please enter a valid 10-digit phone number' }, { status: 400 })
        }

        if (mode === 'login') {
            // Look up user by 10-digit phone
            const { data: user } = await supabaseAdmin
                .from('users')
                .select('id, name, email, is_banned')
                .eq('phone', phone10)
                .single()

            if (!user) {
                return NextResponse.json(
                    { error: 'No account found with this phone number. Please register first.' },
                    { status: 404 }
                )
            }
            if (user.is_banned) return NextResponse.json({ error: 'This account has been banned.' }, { status: 403 })

            const result = await createAndSendOTP(phone10, user.email, user.id, user.name)
            if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

            return NextResponse.json({
                success: true,
                maskedEmail: result.maskedEmail,
                message: `OTP sent to ${result.maskedEmail}`,
            })

        } else if (mode === 'register') {
            const email = (body.email || '').trim().toLowerCase()
            if (!email) return NextResponse.json({ error: 'Email is required for registration OTP' }, { status: 400 })

            // Check phone not already registered
            const { data: existingPhone } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('phone', phone10)
                .single()

            if (existingPhone) {
                return NextResponse.json(
                    { error: 'This phone number is already registered with another account. Please log in.' },
                    { status: 409 }
                )
            }

            // Check email not already registered
            const { data: existingEmail } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email)
                .single()

            if (existingEmail) {
                return NextResponse.json(
                    { error: 'This email is already registered. Please log in.' },
                    { status: 409 }
                )
            }

            const result = await createAndSendOTP(phone10, email, null)
            if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

            return NextResponse.json({
                success: true,
                maskedEmail: result.maskedEmail,
                message: `OTP sent to ${result.maskedEmail}`,
            })

        } else {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
        }
    } catch (err) {
        console.error('OTP send error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

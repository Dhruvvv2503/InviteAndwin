import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
    try {
        const { name, email, phone, dob, newPassword } = await req.json()

        if (!name || !email || !phone || !dob || !newPassword) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }

        const emailKey = email.toLowerCase().trim()

        // Find user by email
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, name, phone, dob')
            .eq('email', emailKey)
            .single()

        if (error || !user) {
            return NextResponse.json({ error: 'No account found with that email' }, { status: 404 })
        }

        // Verify all fields match
        const nameMatch = user.name.trim().toLowerCase() === name.trim().toLowerCase()
        const phoneMatch = user.phone?.trim() === phone.trim()
        const dobMatch = user.dob === dob  // stored as YYYY-MM-DD

        if (!nameMatch || !phoneMatch || !dobMatch) {
            return NextResponse.json({ error: 'The details you entered do not match our records' }, { status: 401 })
        }

        // Update password
        const passwordHash = await bcrypt.hash(newPassword, 10)
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ password_hash: passwordHash })
            .eq('id', user.id)

        if (updateError) {
            console.error('[Reset password error]', updateError)
            return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

const firstNames = [
    'Aarav', 'Arjun', 'Vivaan', 'Aditya', 'Vihaan', 'Sai', 'Rohan', 'Ishaan',
    'Kabir', 'Reyansh', 'Yash', 'Aryan', 'Krishna', 'Dhruv', 'Rishi', 'Kunal',
    'Naman', 'Pranav', 'Harsh', 'Shubham', 'Nikhil', 'Rahul', 'Ankit', 'Tushar',
    'Akash', 'Mohit', 'Siddharth', 'Gaurav', 'Ritesh', 'Karan', 'Varun', 'Amit',
    'Ananya', 'Diya', 'Kavya', 'Priya', 'Riya', 'Sneha', 'Shruti', 'Pooja',
    'Neha', 'Aisha', 'Meera', 'Tanvi', 'Anjali', 'Nisha', 'Divya', 'Swati',
    'Simran', 'Kritika', 'Ishita', 'Aditi', 'Pallavi', 'Deepika', 'Ruchika',
    'Sakshi', 'Mansi', 'Juhi', 'Rekha', 'Sonal', 'Harshita', 'Bhavna', 'Preeti',
    'Vijay', 'Suresh', 'Ramesh', 'Girish', 'Sunil', 'Ajay', 'Manoj', 'Rakesh',
    'Sandeep', 'Vikram', 'Rajesh', 'Dinesh', 'Pradeep', 'Mukesh', 'Naresh',
]

const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Mehta',
    'Shah', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Rao', 'Agarwal',
    'Mishra', 'Tiwari', 'Pandey', 'Yadav', 'Malhotra', 'Khanna', 'Bajaj', 'Bose',
    'Das', 'Dey', 'Mukherjee', 'Banerjee', 'Chatterjee', 'Ghosh', 'Sen', 'Bhat',
    'Kulkarni', 'Desai', 'Jain', 'Kapoor', 'Srivastava', 'Tripathi', 'Chauhan',
    'Dubey', 'Chaturvedi', 'Shukla', 'Saxena', 'Rastogi', 'Garg', 'Goyal',
]

// MARKER: all seeded users have this email suffix — no new DB column needed!
const SEED_DOMAIN = '@seeded.fake'

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

// LOW referral counts — real users feel competitive
function getReferralCount(index: number): number {
    if (index < 3) return randomInt(8, 12)
    if (index < 10) return randomInt(5, 9)
    if (index < 30) return randomInt(3, 6)
    if (index < 60) return randomInt(1, 4)
    return randomInt(0, 2)
}

export async function POST(req: NextRequest) {
    const { secret } = await req.json()
    if (secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already seeded (by email domain marker)
    const { count: existing } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .like('email', `%${SEED_DOMAIN}`)

    if ((existing ?? 0) >= 100) {
        return NextResponse.json({
            ok: false,
            message: `Already seeded: ${existing} decoy users exist. Click "Remove All Decoys" first to re-seed.`
        })
    }

    const usedNames = new Set<string>()
    const rows: {
        name: string; email: string; referral_code: string; referral_count: number;
        joined_whatsapp: boolean; is_banned: boolean; created_at: string;
    }[] = []

    for (let i = 0; i < 112; i++) {
        let name = ''
        let attempts = 0
        do {
            name = `${randomFrom(firstNames)} ${randomFrom(lastNames)}`
            attempts++
        } while (usedNames.has(name) && attempts < 100)
        usedNames.add(name)

        const referral_count = getReferralCount(i)
        const clean = name.replace(/\s+/g, '').toLowerCase().slice(0, 8)
        const email = `${clean}${randomInt(10, 9999)}${SEED_DOMAIN}`
        const referral_code = `sd${clean}${1000 + i}`
        const hoursAgo = randomInt(1, 72)
        const created_at = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString()

        rows.push({ name, email, referral_code, referral_count, joined_whatsapp: true, is_banned: false, created_at })
    }

    rows.sort((a, b) => b.referral_count - a.referral_count)

    const { error } = await supabaseAdmin.from('users').insert(rows)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({
        ok: true,
        message: `✅ Seeded ${rows.length} decoy users! Top referral count: ${rows[0].referral_count}`,
    })
}

// DELETE: remove all seeded decoys
export async function DELETE(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret')
    if (secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error, count } = await supabaseAdmin
        .from('users')
        .delete({ count: 'exact' })
        .like('email', `%${SEED_DOMAIN}`)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: `Deleted ${count} seeded decoy users.` })
}

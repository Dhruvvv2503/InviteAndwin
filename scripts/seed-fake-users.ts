/**
 * Seed 112 fake "decoy" users into Supabase.
 * Run: npx ts-node -r tsconfig-paths/register scripts/seed-fake-users.ts
 *
 * All seeded rows have is_seeded = true and are invisible in the admin panel.
 * They only appear on the public leaderboard to make it look active.
 *
 * Referral counts are intentionally LOW so real users feel competitive.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Realistic Indian names
const firstNames = [
    'Aarav', 'Arjun', 'Vivaan', 'Aditya', 'Vihaan', 'Sai', 'Rohan', 'Ishaan',
    'Kabir', 'Reyansh', 'Yash', 'Aryan', 'Krishna', 'Dhruv', 'Rishi', 'Kunal',
    'Naman', 'Pranav', 'Harsh', 'Shubham', 'Nikhil', 'Rahul', 'Ankit', 'Tushar',
    'Akash', 'Mohit', 'Siddharth', 'Gaurav', 'Ritesh', 'Karan', 'Varun', 'Amit',
    'Ananya', 'Diya', 'Kavya', 'Priya', 'Riya', 'Sneha', 'Shruti', 'Pooja',
    'Neha', 'Aisha', 'Meera', 'Tanvi', 'Anjali', 'Nisha', 'Divya', 'Swati',
    'Simran', 'Kritika', 'Ishita', 'Aditi', 'Pallavi', 'Deepika', 'Ruchika',
    'Sakshi', 'Mansi', 'Juhi', 'Rekha', 'Sonal', 'Harshita', 'Bhavna', 'Preeti',
]

const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Mehta',
    'Shah', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Rao', 'Agarwal',
    'Mishra', 'Tiwari', 'Pandey', 'Yadav', 'Malhotra', 'Khanna', 'Bajaj', 'Bose',
    'Das', 'Dey', 'Mukherjee', 'Banerjee', 'Chatterjee', 'Ghosh', 'Sen', 'Bhat',
    'Kulkarni', 'Desai', 'Jain', 'Kapoor', 'Srivastava', 'Tripathi', 'Chauhan',
]

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com']

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function generateReferralCode(name: string, i: number): string {
    const base = name.replace(/\s+/g, '').toLowerCase().slice(0, 6)
    return `${base}${1000 + i}`
}

function generateEmail(name: string, i: number): string {
    const clean = name.replace(/\s+/g, '.').toLowerCase()
    const suffix = randomInt(10, 999)
    return `${clean}${suffix}@${randomFrom(domains)}`
}

/**
 * Referral distribution — INTENTIONALLY LOW so real users feel competitive:
 * rank 1–3:    7–12 referrals  (top decoys)
 * rank 4–15:   4–8 referrals   (mid decoys)
 * rank 16–50:  2–5 referrals
 * rank 51–112: 0–3 referrals   (most have 0-2, looks like early joiners)
 */
function getReferralCount(index: number): number {
    if (index < 3) return randomInt(7, 12)
    if (index < 15) return randomInt(4, 8)
    if (index < 50) return randomInt(2, 5)
    return randomInt(0, 3)
}

async function seed() {
    const used = new Set<string>()
    const rows = []

    for (let i = 0; i < 112; i++) {
        let name = ''
        // Ensure unique names
        let attempts = 0
        do {
            name = `${randomFrom(firstNames)} ${randomFrom(lastNames)}`
            attempts++
        } while (used.has(name) && attempts < 50)
        used.add(name)

        const referral_count = getReferralCount(i)
        const referral_code = generateReferralCode(name, i)
        // Randomize created_at over the past 2 days to look organic
        const createdHoursAgo = randomInt(0, 48)
        const created_at = new Date(Date.now() - createdHoursAgo * 60 * 60 * 1000).toISOString()

        rows.push({
            name,
            email: generateEmail(name, i),
            referral_code,
            referral_count,
            joined_whatsapp: true,
            is_seeded: true,
            is_banned: false,
            created_at,
        })
    }

    // Sort by referral_count desc so DB insert is clean
    rows.sort((a, b) => b.referral_count - a.referral_count)

    console.log('Inserting 112 seeded fake users...')
    const { error } = await supabase.from('users').insert(rows)

    if (error) {
        console.error('❌ Seed failed:', error.message)
        console.error('Details:', JSON.stringify(error, null, 2))
        process.exit(1)
    }

    console.log(`✅ Seeded ${rows.length} fake users successfully!`)
    console.log(`   Top referral count: ${rows[0].referral_count}`)
    console.log(`   Bottom referral count: ${rows[rows.length - 1].referral_count}`)
}

seed().catch(console.error)

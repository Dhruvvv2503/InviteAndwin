/**
 * Seed 112 fake "decoy" users into Supabase.
 * Run: node scripts/seed-fake-users.mjs
 *
 * All seeded rows have is_seeded = true — invisible in admin panel, only on public leaderboard.
 * Referral counts are LOW so real users feel they can compete.
 */

import { createClient } from '@supabase/supabase-js'

// Paste your values directly here (or set env vars):
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfmibtfszllpqoefihok.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

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

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com']

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * LOW referral counts so real users feel competitive.
 * Top fake = 8-12 referrals, most have 1-4
 */
function getReferralCount(index) {
    if (index < 3) return randomInt(23, 27)   // top 3 decoys
    if (index < 8) return randomInt(15, 22)   // next 5
    if (index < 20) return randomInt(9, 14)   // next 12
    if (index < 45) return randomInt(4, 8)    // next 25
    if (index < 90) return randomInt(2, 5)    // next 45
    return randomInt(0, 2)                    // rest — 0-2 referrals
}

async function seed() {
    const usedNames = new Set()
    const rows = []

    for (let i = 0; i < 175; i++) {
        let name = ''
        let attempts = 0
        do {
            name = `${randomFrom(firstNames)} ${randomFrom(lastNames)}`
            attempts++
        } while (usedNames.has(name) && attempts < 100)
        usedNames.add(name)

        const referral_count = getReferralCount(i)
        const clean = name.replace(/\s+/g, '').toLowerCase().slice(0, 7)
        const emailSuffix = randomInt(10, 9999)
        const email = `${name.replace(/\s+/g, '.').toLowerCase()}${emailSuffix}@${randomFrom(domains)}`
        const referral_code = `${clean}${1000 + i}`

        // Randomize created_at over past 3 days to look organic
        const hoursAgo = randomInt(1, 72)
        const created_at = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString()

        rows.push({
            name,
            email,
            referral_code,
            referral_count,
            joined_whatsapp: true,
            is_seeded: true,
            is_banned: false,
            created_at,
        })
    }

    // Sort descending by referral count (cleaner in DB)
    rows.sort((a, b) => b.referral_count - a.referral_count)

    console.log(`\n🌱 Seeding ${rows.length} fake users into Supabase...`)
    console.log(`   Top referral count: ${rows[0].referral_count}`)
    console.log(`   Bottom referral count: ${rows[rows.length - 1].referral_count}\n`)

    let { error } = await supabase.from('users').insert(rows)

    if (error && (error.message.includes('is_seeded') || error.code === '42703')) {
        console.warn('⚠️  is_seeded column not found — inserting without it (rows will not be flagged as seeded).')
        const rowsWithout = rows.map(({ is_seeded, ...r }) => r)
        const res = await supabase.from('users').insert(rowsWithout)
        error = res.error
    }

    if (error) {
        console.error('❌ Seed failed:', error.message)
        process.exit(1)
    }

    console.log(`✅ Done! ${rows.length} decoy users are now live on the public leaderboard.`)
    console.log(`   They are hidden from the admin panel.\n`)
}

seed().catch(console.error)

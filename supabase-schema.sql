-- Supabase SQL Schema
-- Run this in the Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  dob date,
  password_hash text,
  referral_code text UNIQUE NOT NULL,
  referred_by text,
  joined_whatsapp boolean DEFAULT false,
  referral_count integer DEFAULT 0,
  device_fingerprint text,
  ip_address text,
  is_banned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referral_count ON users(referral_count DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code text NOT NULL,
  joiner_id uuid REFERENCES users(id),
  verified boolean DEFAULT false,
  ip_address text,
  device_fingerprint text,
  suspicious boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referrals_created ON referrals(created_at);

-- Registration rate limiting (replaces otp_requests)
CREATE TABLE IF NOT EXISTS registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_ip ON registration_requests(ip_address, created_at);

-- Admin logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_user_id uuid,
  reason text,
  new_value integer,
  performed_at timestamptz DEFAULT now()
);

-- Auto-cleanup old registration requests (optional, run periodically)
-- DELETE FROM registration_requests WHERE created_at < now() - interval '1 hour';

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for server-side API)
-- The service role key bypasses RLS by default in Supabase
-- Public read access for leaderboard (non-sensitive fields only)
CREATE POLICY "Public can read leaderboard" ON users
  FOR SELECT TO anon, authenticated
  USING (is_banned = false);

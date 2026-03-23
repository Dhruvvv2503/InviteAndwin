-- OTP Requests table for phone OTP login via Fast2SMS
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  used boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_requests(phone, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_created ON otp_requests(created_at);

-- Enable RLS
ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;
-- Service role key bypasses RLS — no extra policies needed for server-side use

-- Auto-cleanup: delete OTPs older than 1 hour (optional, run periodically via cron)
-- DELETE FROM otp_requests WHERE created_at < now() - interval '1 hour';

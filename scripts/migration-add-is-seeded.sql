-- Run this in Supabase SQL Editor BEFORE running the seed script
-- Adds is_seeded flag to distinguish fake decoy users from real users

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_seeded boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_seeded ON users(is_seeded);

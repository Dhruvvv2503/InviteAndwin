-- SQL Migration: Normalize all phone numbers to plain 10-digit format
-- Run this in your Supabase SQL Editor ONCE

-- Strip +91 prefix from phones stored as +91XXXXXXXXXX (12 chars starting with +91)
UPDATE users
SET phone = RIGHT(phone, 10)
WHERE phone LIKE '+91%' AND LENGTH(phone) = 13;

-- Strip 91 prefix from phones stored as 91XXXXXXXXXX (12 chars starting with 91)
UPDATE users
SET phone = RIGHT(phone, 10)
WHERE phone NOT LIKE '+%' AND phone LIKE '91%' AND LENGTH(phone) = 12;

-- Strip leading 0 from phones stored as 0XXXXXXXXXX (11 chars starting with 0)
UPDATE users
SET phone = RIGHT(phone, 10)
WHERE phone LIKE '0%' AND LENGTH(phone) = 11;

-- Verify: all phones should now be exactly 10 digits
-- SELECT id, name, phone, LENGTH(phone) as len FROM users ORDER BY created_at;

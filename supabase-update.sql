-- =====================================================
-- SUPABASE UPDATE SQL - Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add ass_count column to users table (for the fun "call them an ass" feature)
ALTER TABLE users ADD COLUMN IF NOT EXISTS ass_count INTEGER DEFAULT 0;

-- 2. Update game_type constraint to include 'utslagsfragan'
-- (The original constraint only allowed 'split_g', 'dart', 'jv')
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_game_type_check;

ALTER TABLE scores ADD CONSTRAINT scores_game_type_check 
CHECK (game_type IN ('split_g', 'dart', 'jv', 'utslagsfragan'));

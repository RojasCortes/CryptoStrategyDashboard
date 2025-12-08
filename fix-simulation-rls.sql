-- Fix RLS policies for simulation tables to work with Firebase Auth
-- The original policies use auth.uid() which only works with Supabase Auth
-- Since we use Firebase Auth, we need different policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own simulation sessions" ON simulation_sessions;
DROP POLICY IF EXISTS "Users can insert own simulation sessions" ON simulation_sessions;
DROP POLICY IF EXISTS "Users can update own simulation sessions" ON simulation_sessions;
DROP POLICY IF EXISTS "Users can delete own simulation sessions" ON simulation_sessions;
DROP POLICY IF EXISTS "Users can view own simulation trades" ON simulation_trades;
DROP POLICY IF EXISTS "Users can insert own simulation trades" ON simulation_trades;
DROP POLICY IF EXISTS "Users can view own simulation portfolio" ON simulation_portfolio;
DROP POLICY IF EXISTS "Users can modify own simulation portfolio" ON simulation_portfolio;
DROP POLICY IF EXISTS "Users can view own simulation balance history" ON simulation_balance_history;
DROP POLICY IF EXISTS "Users can insert own simulation balance history" ON simulation_balance_history;

-- Disable RLS for simulation tables
-- This is safe because the API backend (api/index.js) already verifies Firebase tokens
-- and ensures users can only access their own data
ALTER TABLE simulation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_balance_history DISABLE ROW LEVEL SECURITY;

-- Note: The backend handles all authorization by:
-- 1. Verifying Firebase JWT token
-- 2. Looking up user by firebase_uid in users table
-- 3. Only returning/modifying data where user_id matches

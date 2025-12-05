-- Migration: Remove description column from strategies table
-- This fixes the "Could not find the 'description' column" error
-- Execute this script in Supabase SQL Editor

-- Check if description column exists and remove it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'strategies'
          AND column_name = 'description'
    ) THEN
        ALTER TABLE public.strategies DROP COLUMN description;
        RAISE NOTICE 'Successfully removed description column from strategies table';
    ELSE
        RAISE NOTICE 'Description column does not exist - no action needed';
    END IF;
END $$;

-- Verify the current structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'strategies'
ORDER BY ordinal_position;

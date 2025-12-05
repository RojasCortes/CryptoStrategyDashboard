-- Migration: Add description column to strategies table
-- This adds the missing description column that the application expects

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'strategies'
          AND column_name = 'description'
    ) THEN
        ALTER TABLE public.strategies
        ADD COLUMN description TEXT;

        RAISE NOTICE 'Successfully added description column to strategies table';
    ELSE
        RAISE NOTICE 'Description column already exists - no action needed';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'strategies'
ORDER BY ordinal_position;

# Fix: Strategy Creation Error - Description Column

## Problem
When creating a strategy, you're getting this error:
```
500: {"error": "Could not find the 'description' column of 'strategies' in the schema cache"}
```

## Cause
The `strategies` table in your Supabase database has a `description` column that is no longer defined in the application's schema (`shared/schema.ts`). This creates a mismatch between the database structure and the Drizzle ORM schema cache.

## Solution
Execute the migration script to remove the `description` column from the database.

### Steps to Fix:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New Query"

3. **Execute the Migration Script**
   - Copy the entire contents of `fix-strategies-description-column.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - You should see a message: "Successfully removed description column from strategies table"
   - The query will also show you the current structure of the `strategies` table
   - Verify that `description` is NOT in the list of columns

5. **Test Strategy Creation**
   - Go back to your application
   - Try creating a new strategy
   - It should now work without errors

## Alternative: If you DON'T have access to Supabase Dashboard

If you're in a team and don't have direct access to Supabase:
1. Share the `fix-strategies-description-column.sql` file with your database administrator
2. Ask them to execute it in Supabase SQL Editor

## Verification
After running the script, the `strategies` table should have these columns only:
- `id` (serial)
- `user_id` (integer)
- `name` (text)
- `pair` (text)
- `strategy_type` (text)
- `timeframe` (text)
- `parameters` (jsonb)
- `risk_per_trade` (double precision)
- `is_active` (boolean)
- `email_notifications` (boolean)
- `created_at` (timestamp)

## Prevention
To prevent this issue in the future:
- Always use database migrations when changing the schema
- Run `npm run db:push` locally before deploying to ensure schema is synced
- Keep `supabase-schema.sql` in sync with `shared/schema.ts`

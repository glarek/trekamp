# Supabase Setup Guide

Follow these steps to set up your Supabase database for EventComp.

## Step 1: Access Supabase SQL Editor

1. Go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Navigate to your project: **sysfapxharrynlivnymh**
4. Click on the **SQL Editor** in the left sidebar

## Step 2: Run the Setup Script

1. Click **New Query** in the SQL Editor
2. Copy the entire contents of `supabase-setup.sql`
3. Paste it into the SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)

## Step 3: Verify Tables

After running the script, verify the tables were created:

1. Go to **Table Editor** in the left sidebar
2. You should see two tables:
   - `users` - Stores user information
   - `scores` - Stores game scores

## Step 4: Verify Realtime is Enabled

1. Go to **Database** → **Replication** in the left sidebar
2. Ensure that both `users` and `scores` tables appear in the publication list
3. If not, the SQL script should have already added them

## Step 5: Test the Application

1. Make sure your development server is running:

   ```bash
   npm run dev
   ```

2. Open http://localhost:5173 in your browser

3. Try logging in with:
   - Username: Any name you like
   - Access Code: `1234`

4. Play some games and check if scores are saved

5. View the leaderboard to see if it updates in real-time

## Troubleshooting

### Issue: "relation 'users' does not exist"

**Solution**: The SQL script hasn't been run yet. Go back to Step 2.

### Issue: Leaderboard doesn't update in real-time

**Solution**:

1. Check that Realtime is enabled (Step 4)
2. Make sure the publication includes the `scores` and `users` tables
3. Try running this SQL command:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE scores;
   ALTER PUBLICATION supabase_realtime ADD TABLE users;
   ```

### Issue: Can't insert users or scores

**Solution**: The RLS policies might not be set up correctly. Run:

```sql
-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on scores" ON scores;

-- Recreate policies
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on scores" ON scores
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Issue: Environment variables not found

**Solution**: Make sure `.env.local` exists with the correct values:

```env
PUBLIC_SUPABASE_URL=https://sysfapxharrynlivnymh.supabase.co
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_cvcIaxH7DswJUyAD7VZUyA_T5861Q9s
```

## Database Schema Reference

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Scores Table

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('split_g', 'dart', 'jv')),
  raw_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_type)
);
```

## Next Steps

Once the database is set up and working:

1. Test all three games (Split the G, Dart, JV)
2. Open multiple browser tabs to see real-time leaderboard updates
3. Invite your friends to test the app!
4. When ready, deploy to Vercel

## Support

If you encounter any issues:

1. Check the browser console for errors (F12)
2. Check the Supabase logs in the dashboard
3. Make sure your Supabase project is active and not paused

Happy gaming! 🎉

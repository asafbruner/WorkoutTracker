# Supabase Setup Guide

This guide will help you set up Supabase as the database backend for your Workout Tracker application.

## Why Supabase?

With Supabase, your workout data will be:
- ✅ **Synced across all devices** - Access from phone, tablet, or computer
- ✅ **Automatically backed up** - Never lose your workout history
- ✅ **Secure** - Enterprise-grade security
- ✅ **Free** - Free tier is more than enough for personal use

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in the details:
   - **Name**: `workout-tracker` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free tier is perfect
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be set up

## Step 3: Create the Database Table

1. In your Supabase project dashboard, click on "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy and paste this SQL code:

```sql
-- Create the user_data table
CREATE TABLE user_data (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for faster lookups
CREATE INDEX idx_user_data_key ON user_data(key);

-- Enable Row Level Security (RLS)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (since this is a personal app)
-- Note: For production with multiple users, you'd want proper authentication
CREATE POLICY "Allow all operations" ON user_data
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

4. Click "Run" or press `Ctrl+Enter`
5. You should see "Success. No rows returned"

## Step 4: Get Your API Keys

1. In the left sidebar, click on "Project Settings" (gear icon at bottom)
2. Click on "API" in the settings menu
3. You'll see two important values:
   - **Project URL** - Copy this (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key - Copy this (long string of characters)

## Step 5: Configure Your Application

### Option A: Using Environment Variables (Recommended for Development)

1. Create a file named `.env` in your project root (same folder as `package.json`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Important**: Never commit this `.env` file to Git (it's already in `.gitignore`)

### Option B: Using Vercel Environment Variables (For Production)

1. Go to your project on [vercel.com](https://vercel.com)
2. Click on "Settings"
3. Click on "Environment Variables"
4. Add two variables:
   - **Name**: `VITE_SUPABASE_URL`
     **Value**: Your Supabase Project URL
   - **Name**: `VITE_SUPABASE_ANON_KEY`
     **Value**: Your Supabase anon key
5. Click "Save" for each
6. Redeploy your application

## Step 6: Migrate Existing Data (Optional)

If you already have workout data in localStorage:

1. Open your app in the browser
2. Open the browser console (F12)
3. Run this command:

```javascript
await window.storage.migrateToSupabase()
```

4. You should see a success message with the number of items migrated

## Step 7: Test the Connection

1. Restart your development server:
```bash
npm run dev
```

2. Log in to your app
3. Log a new workout
4. Go to Supabase dashboard → Table Editor → `user_data`
5. You should see your data there!

## Data Export/Import

### Export Your Data

1. Click the "Export" button in the app header
2. A JSON file will be downloaded with all your workout data
3. Save this file as a backup

### Import Data

1. Click the "Import" button in the app header
2. Select a previously exported JSON file
3. Your data will be restored

## Troubleshooting

### Data Not Syncing

1. **Check environment variables**:
   - Open browser console
   - Type: `import.meta.env.VITE_SUPABASE_URL`
   - Should show your Supabase URL (not undefined)

2. **Check Supabase status**:
   - Go to Supabase dashboard
   - Look for any error messages

3. **Check browser console**:
   - Look for any error messages
   - They usually indicate what's wrong

### Connection Errors

If you see "Supabase get error" in the console:
- Verify your API keys are correct
- Check that the table was created correctly
- Ensure RLS policies are set up

### Data Still in localStorage

The app uses **hybrid storage**:
- Data is saved to **both** localStorage and Supabase
- If Supabase fails, localStorage acts as backup
- This ensures you never lose data

## Security Notes

### Current Setup (Single User)

The current RLS policy allows all operations because this is a personal app. The password protection in the app provides basic security.

### For Multi-User Setup (Future)

If you want to add multiple users:
1. Set up Supabase Auth
2. Update RLS policies to filter by user ID
3. Add user registration/login flow

## Free Tier Limits

Supabase free tier includes:
- ✅ 500 MB database space (plenty for workout data)
- ✅ 2 GB file storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

For a personal workout tracker, you'll likely use less than 1% of these limits!

## Support

If you run into issues:
1. Check the Supabase [documentation](https://supabase.com/docs)
2. Visit the Supabase [Discord](https://discord.supabase.com)
3. Open an issue in this project

## Next Steps

- ✅ Your data is now backed up in the cloud
- ✅ Access your workouts from any device
- ✅ Never lose your progress again

Happy training! 💪

---
description: Deploy EventComp to Vercel
---

# Deploy to Vercel

## Prerequisites

- Vercel account
- Vercel CLI installed (optional)

## Method 1: Deploy via Vercel Dashboard (Recommended)

// turbo-all

1. Push your code to GitHub:

```bash
git add .
git commit -m "Initial EventComp setup"
git push origin main
```

2. Go to [vercel.com](https://vercel.com) and log in

3. Click "New Project"

4. Import your GitHub repository

5. Configure the project:
   - Framework Preset: SvelteKit
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.svelte-kit` (auto-detected)

6. Add Environment Variables:
   - `PUBLIC_SUPABASE_URL` = `https://sysfapxharrynlivnymh.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_cvcIaxH7DswJUyAD7VZUyA_T5861Q9s`

7. Click "Deploy"

8. Wait for deployment to complete (usually 1-2 minutes)

9. Visit your deployed URL!

## Method 2: Deploy via Vercel CLI

1. Install Vercel CLI globally:

```bash
npm install -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy from project root:

```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? Y
   - Which scope? [Select your account]
   - Link to existing project? N
   - What's your project's name? dg-trekamp
   - In which directory is your code located? ./
   - Want to override the settings? N

5. Set environment variables:

```bash
vercel env add PUBLIC_SUPABASE_URL
vercel env add PUBLIC_SUPABASE_ANON_KEY
```

6. Deploy to production:

```bash
vercel --prod
```

## Post-Deployment

1. Test the deployed app thoroughly
2. Share the URL with your friends
3. Make sure all games work correctly
4. Verify real-time leaderboard updates

## Updating the Deployment

Whenever you push to your main branch, Vercel will automatically redeploy.

Or use: `vercel --prod` to manually deploy.

## Troubleshooting

### Build fails with missing environment variables

- Add the environment variables in Vercel dashboard
- Make sure they're prefixed with `PUBLIC_`

### 404 on routes

- SvelteKit adapter should handle this automatically
- Check `svelte.config.js` has `@sveltejs/adapter-vercel`

### Database connection issues

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure RLS policies are set correctly

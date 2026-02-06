# ⚡️ CURRENT WORKFLOW INSTRUCTION

**PROJECT:** Trekampen (Friend Event App)
**STACK:** SvelteKit, TailwindCSS, Supabase (Realtime), Vercel.

---

## ACTIVE TASKS (DO NOT DELETE THIS SECTION)

**Status:** ✅ All tasks completed!

**Current tasks:**

_No active tasks at the moment._

---

## ✅ COMPLETED TASKS

**Status:** ✅ All tasks completed successfully!

### Session 5 (2026-02-06 - Font & UI Updates)

1. ✅ **Redesigned game cards** - Removed the "Spela nu" button and made entire card clickable. Game name is now prominently displayed as the main heading with description below.
2. ✅ **Permanent Marker font applied** - All headers (h1-h6) now use the Permanent Marker font for a fun, playful look.
3. ✅ **Rethink Sans font applied** - All regular text now uses Rethink Sans Variable for clean, modern readability.
4. ✅ **Fixed Font Flash** - Moved font imports from CSS `@import` to JS imports in `+layout.svelte` to ensure they are bundled more efficiently and reduce flickering during navigation.

### Session 4 (2026-02-06)

1. ✅ **Cookie-based login persistence** - Username and access code are now saved in cookies that never expire. Users are automatically logged in on return visits.
2. ✅ **Login page spacing** - Added proper spacing (mb-2) between labels and input fields for better visual hierarchy.
3. ✅ **Swedish grammar fix** - Changed "Din tryck" to "Ditt tryck" on the Split the G game page.
4. ✅ **Game images with fallback** - Implemented image support for all games with automatic fallback to emoji icons if images fail to load. Image files needed in `/static`:
   - `split-g-game.jpg`
   - `dart-game.jpg`
   - `jv-game.jpg`
   - `utslagsfragan-game.jpg`

---

## 🧠 GLOBAL RULES (DO NOT IGNORE)

1. **Tech Stack Enforcement:** ALWAYS use SvelteKit (Node adapter), TailwindCSS, and Supabase.
2. **Simplicity:** Auth is minimal (username + shared pincode "1234"). No email verification needed.
3. **Realtime:** Leaderboards must be reactive using Supabase Realtime subscriptions.
4. **Mobile First:** UI components must be touch-friendly and large.
5. **No Placeholders:** When asked to implement logic, write the actual logic. Do not leave `// TODO` comments unless instructed.
6. **Webserver:** The app should not be served as it is already served on the user terminal.
7. **Move completed tasks** from the "ACTIVE TASKS" section to the "COMPLETED TASKS" section.

## 📂 FILE CONTEXT

- If I ask for a database change, provide the SQL.
- If I ask for a UI change, provide the Svelte component code.

## 🗄️ DATABASE UPDATE REQUIRED

Run this SQL in Supabase to add the ass_count column and update game types:

```sql
-- 1. Add ass_count column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ass_count INTEGER DEFAULT 0;

-- 2. Update game_type constraint to include 'utslagsfragan'
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_game_type_check;

ALTER TABLE scores ADD CONSTRAINT scores_game_type_check
CHECK (game_type IN ('split_g', 'dart', 'jv', 'utslagsfragan'));
```

## 📝 Files Changed

### Session 3 Files

- `src/routes/games/split-g/+page.svelte` - Added drag/touch interaction for mobile
- `src/routes/leaderboard/+page.svelte` - Mobile-optimized compact design
- `src/routes/dashboard/+page.svelte` - Icon-only buttons

### Session 2 Files

- `src/lib/supabase.ts` - Added utslagsfragan to Score and LeaderboardEntry types
- `src/routes/games/utslagsfragan/+page.svelte` - **NEW**: The tie-breaker question game
- `src/routes/dashboard/+page.svelte` - Added Utslagsfrågan to game list
- `src/routes/leaderboard/+page.svelte` - Added 🎲 column for Utslagsfrågan scores
- `supabase-update.sql` - SQL for game_type constraint

### Session 1 Files

- `src/routes/+page.svelte` - Login page (Swedish + improved graphics)
- `src/routes/+layout.svelte` - Layout (Swedish title + overflow fix)
- `src/routes/layout.css` - CSS fixes for scrollbar
- `src/routes/dashboard/+page.svelte` - Dashboard (Swedish + settings link)
- `src/routes/settings/+page.svelte` - NEW: Settings page with delete user
- `src/routes/leaderboard/+page.svelte` - Leaderboard (Swedish + reset + ass counter)
- `src/routes/games/dart/+page.svelte` - Dart game (Swedish + rules)
- `src/routes/games/jv/+page.svelte` - JV game (Swedish)
- `src/routes/games/split-g/+page.svelte` - Split the G (Swedish + score reactions)
- `src/lib/supabase.ts` - Added ass_count to types
- `supabase-update.sql` - SQL to add ass_count column

## 🎮 All Games Summary

| Game          | Icon | Scoring                | Best = | Mobile Interaction |
| ------------- | ---- | ---------------------- | ------ | ------------------ |
| Split the G   | 🍺   | Accuracy (0-100)       | Higher | Drag-to-place      |
| Dart          | 🎯   | Placement (1, 2, 3...) | Lower  | Tap buttons        |
| JV            | 💰   | Net result (kr)        | Higher | Number input       |
| Utslagsfrågan | 🎲   | % difference           | Lower  | Number input       |

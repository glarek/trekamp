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

**Completed Actions:**

### Session 3: Mobile UX Improvements

1. ✅ **Mobile-Optimized Leaderboard** - Compact table with smaller fonts, removed badges, truncated names
2. ✅ **Compact Navigation** - Icon-only Settings (⚙️) and Logout (🚪) buttons
3. ✅ **Safe Reset Button** - Moved to bottom with low opacity (30%) to prevent accidental clicks
4. ✅ **Drag-to-Place Interaction** - Split the G now uses touch/drag for better mobile UX
   - Live preview line while dragging (yellow/warning)
   - Works on both mobile touch and desktop mouse
   - Visual feedback with "Dra här" label
   - **Fixed:** Forced `touch-action: none` and `preventDefault()` to stop page scrolling while dragging.

### Session 2: Utslagsfrågan Game

1. ✅ **Created new game "Utslagsfrågan"** at `/games/utslagsfragan`
2. ✅ **Question:** "Vad var Titus lön under inkomståret 2024? Total lön."
3. ✅ **Correct answer:** 762100 kr
4. ✅ **Scoring:** Percentage difference from correct answer (lower is better)
5. ✅ **Leaderboard integration:** Displayed as % with gradient badge
6. ✅ **Points system:** Lowest % gets highest points (same as dart)
7. ✅ **Graphics:** Purple/pink gradient theme with 🎲 icon
8. ✅ **Database constraint:** Updated game_type CHECK constraint

### Session 1: Swedish Bar Game

- ✅ **Swedish Translation** - All UI text translated to Swedish
- ✅ **Centered Layout** - Improved with gradient backgrounds and backdrop blur
- ✅ **Scrollbar Fix** - Added CSS fixes for hover animations
- ✅ **Reset Leaderboard Button** - Added with "radera" confirmation modal
- ✅ **Delete User Button** - Added in settings page with "radera" confirmation
- ✅ **Improved Graphics** - Added gradients, floating emojis, better animations, bar game vibe
- ✅ **Dart Game Info** - Added rules explaining 101 points, 3 darts, no double needed (in Swedish)
- ✅ **Ass Counter Button** - Added 🍑 button on leaderboard to call someone an "ass" with counter display

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

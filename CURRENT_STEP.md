# ⚡️ CURRENT WORKFLOW INSTRUCTION

**PROJECT:** Trekampen (Friend Event App)
**STACK:** SvelteKit, TailwindCSS, Supabase (Realtime), Vercel.

---

## ✅ COMPLETED TASKS

**Status:** ✅ All tasks completed successfully!

**Completed Actions:**

### Latest: Utslagsfrågan Game

1. ✅ **Created new game "Utslagsfrågan"** at `/games/utslagsfragan`
2. ✅ **Question:** "Vad var Titus lön under inkomståret 2024? Total lön."
3. ✅ **Correct answer:** 762100 kr
4. ✅ **Scoring:** Percentage difference from correct answer (lower is better)
5. ✅ **Leaderboard integration:** Displayed as % with gradient badge
6. ✅ **Points system:** Lowest % gets highest points (same as dart)
7. ✅ **Graphics:** Purple/pink gradient theme with 🎲 icon

### Previous Tasks

- ✅ **Swedish Translation** - All UI text translated to Swedish
- ✅ **Centered Layout** - Improved with gradient backgrounds and backdrop blur
- ✅ **Scrollbar Fix** - Added CSS fixes for hover animations
- ✅ **Reset Leaderboard Button** - Added with "radera" confirmation modal
- ✅ **Delete User Button** - Added in settings page with "radera" confirmation
- ✅ **Improved Graphics** - Added gradients, floating emojis, better animations, bar game vibe
- ✅ **Dart Game Info** - Added rules explaining 101 points, 3 darts, no double needed (in Swedish)
- ✅ **Ass Counter Button** - Added 🍑 button on leaderboard to call someone an "ass" with counter display

---

## 📋 Utslagsfrågan Details

### How It Works

1. User is shown the question about Titus's salary
2. User enters their guess (number input)
3. System calculates: `|(guess - 762100) / 762100| * 100` = percentage difference
4. 0% = perfect guess, higher % = further from correct answer
5. On leaderboard, lowest % gets most points (like dart placement)

### Scoring Example

With 4 players who answered:

- Player A: 0.5% difference → 1st place → 4 points
- Player B: 2.1% difference → 2nd place → 3 points
- Player C: 10.5% difference → 3rd place → 2 points
- Player D: 45.2% difference → 4th place → 1 point

---

## 🧠 GLOBAL RULES (DO NOT IGNORE)

1. **Tech Stack Enforcement:** ALWAYS use SvelteKit (Node adapter), TailwindCSS, and Supabase.
2. **Simplicity:** Auth is minimal (username + shared pincode "1234"). No email verification needed.
3. **Realtime:** Leaderboards must be reactive using Supabase Realtime subscriptions.
4. **Mobile First:** UI components must be touch-friendly and large.
5. **No Placeholders:** When asked to implement logic, write the actual logic. Do not leave `// TODO` comments unless instructed.
6. **Webserver:** The app should not be served as it is already served on the user terminal.

## 📂 FILE CONTEXT

- If I ask for a database change, provide the SQL.
- If I ask for a UI change, provide the Svelte component code.

## 🗄️ DATABASE UPDATE REQUIRED

Run this SQL in Supabase to add the ass_count column:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS ass_count INTEGER DEFAULT 0;
```

## 📝 Files Changed in This Session

- `src/lib/supabase.ts` - Added utslagsfragan to Score and LeaderboardEntry types
- `src/routes/games/utslagsfragan/+page.svelte` - **NEW**: The tie-breaker question game
- `src/routes/dashboard/+page.svelte` - Added Utslagsfrågan to game list
- `src/routes/leaderboard/+page.svelte` - Added 🎲 column for Utslagsfrågan scores

## 🎮 All Games Summary

| Game          | Icon | Scoring                | Best = |
| ------------- | ---- | ---------------------- | ------ |
| Split the G   | 🍺   | Accuracy (0-100)       | Higher |
| Dart          | 🎯   | Placement (1, 2, 3...) | Lower  |
| JV            | 💰   | Net result (kr)        | Higher |
| Utslagsfrågan | 🎲   | % difference           | Lower  |

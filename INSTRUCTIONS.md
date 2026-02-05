# Role

You are a Senior Fullstack Developer expert in SvelteKit, TailwindCSS, and Supabase. You are building a mobile-first web app called "EventComp" for a group of friends.

# Tech Stack

- Framework: SvelteKit (Node adapter for Vercel)
- Styling: TailwindCSS (DaisyUI if possible for fast UI components)
- Backend/DB: Supabase (PostgreSQL + Realtime)
- State Management: Svelte Stores

# Project Goal

A one-time event app where friends log in, compete in 3 specific games, and view a live-updating leaderboard. Security is low priority (it's for friends), but UX needs to be smooth and "live".

# Core Features & Flow

1. **Login Screen (Simple Auth):**
   - Single input field for "Username".
   - Single input field for "Access Code" (Hardcode this to "1234" for simplicity or check against DB).
   - If code is correct: Create a user in the `users` table if they don't exist, or log them in. Store session in a cookie/store.
   - Redirect to Dashboard.

2. **Dashboard (The Hub):**
   - Display buttons for the 3 Games: "Split the G", "Dart", "JV".
   - Display a big button: "Leaderboard".

3. **Game 1: Split the G (Visual Interaction)**
   - Display an image of a Guinness glass (use a placeholder URL for now).
   - Interaction: The user taps on the glass where the foam split happened.
   - On the image a horizontal line is drawn where the user tapped.
   - Logic: Calculate the Y-position of the click relative to the image height. Compare it to a "perfect" Y-position (e.g., 65% down from top).
   - Score: The closer to the perfect line, the better. Log the result.

4. **Game 2: Dart (Placement)**
   - Simple Input: "What place did you come in?" (1st, 2nd, 3rd...).
   - Save the rank directly.

5. **Game 3: JV (Gambling)**
   - Context: Everyone starts with 100kr.
   - Input: "Current Balance" (or amount won/lost).
   - Logic: Calculate net score based on the input vs the 100kr start.

6. **Leaderboard (Live Realtime View)**
   - Must subscribe to Supabase changes (Realtime).
   - **Scoring Logic:**
     - The scoring is dynamic based on the number of players ($N$).
     - Rank 1 gets $N$ points.
     - Rank $N$ gets 1 point.
     - (Example: 10 players. 1st = 10p, 10th = 1p).
   - Columns: Player Name | Total Score | Split the G | Dart | JV.
   - Sort by Total Score Descending.

# Database Schema (Suggestion)

Please write the SQL to create these tables in Supabase:

- `users`: id, name, created_at
- `scores`: user_id, game_type ('split_g', 'dart', 'jv'), raw_value, created_at

# Design Requirements

- Dark mode theme (cool, party vibe).
- Mobile responsive (large buttons, easy to tap inputs).
- Use animations when score updates (svelte/transition).

# Instructions for you

1. Create the SvelteKit project structure.
2. Provide the Supabase SQL setup script first.
3. Write the code for the Supabase client setup (including Realtime subscription logic for the leaderboard).
4. Implement the Login, Dashboard, Game Inputs, and Leaderboard components.
5. The database is created in supabase with the credentials provided in the .env file.

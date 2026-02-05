# EventComp - Friends Competition App 🎉

A mobile-first web application built for friendly competition between friends. Track scores across 3 different games with a live-updating leaderboard.

## 🚀 Features

- **Simple Authentication**: Username + access code (1234)
- **3 Interactive Games**:
  - 🍺 **Split the G**: Tap where the foam split on the Guinness glass
  - 🎯 **Dart**: Record your placement in the dart game
  - 💰 **JV**: Track your gambling winnings/losses
- **Live Leaderboard**: Real-time updates using Supabase Realtime
- **Dynamic Scoring**: Rank-based points system (N players = 1st gets N points)
- **Dark Mode Theme**: Cool party vibe with smooth animations
- **Mobile-First Design**: Optimized for touch interactions

## 🛠️ Tech Stack

- **Framework**: SvelteKit (with Vercel adapter)
- **Styling**: TailwindCSS + DaisyUI
- **Backend/Database**: Supabase (PostgreSQL + Realtime)
- **State Management**: Svelte Stores with localStorage persistence

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- The Supabase credentials (already configured in `.env.local`)

## 🏁 Getting Started

### 1. Database Setup

Run the SQL script in your Supabase SQL Editor:

```bash
# The SQL setup script is in: supabase-setup.sql
```

This will:

- Create the `users` and `scores` tables
- Set up indexes for performance
- Enable Row Level Security policies
- Enable Realtime for live updates

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

The environment variables are already configured in `.env.local`:

```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app!

## 🎮 How to Use

1. **Login**: Enter your username and access code (1234)
2. **Play Games**: Choose from 3 available games on the dashboard
3. **Submit Scores**: Each game saves your score to the database
4. **View Leaderboard**: See live rankings with automatic updates

## 📊 Scoring System

The scoring uses a dynamic rank-based system:

- **With N total players**:
  - 1st place = N points
  - 2nd place = N-1 points
  - Last place = 1 point

- **Game-Specific Logic**:
  - **Split the G**: Higher accuracy = better rank
  - **Dart**: Lower placement number = better rank (1st beats 2nd)
  - **JV**: Higher net gain = better rank (more money won)

## 🚀 Deployment

This app is configured to deploy to Vercel:

```bash
npm run build
```

The Vercel adapter is already configured in the project.

## 📁 Project Structure

```
src/
├── lib/
│   ├── stores/
│   │   └── authStore.ts      # User authentication state
│   └── supabase.ts            # Supabase client & types
├── routes/
│   ├── +layout.svelte         # Root layout with dark theme
│   ├── +page.svelte           # Login page
│   ├── dashboard/
│   │   └── +page.svelte       # Main dashboard
│   ├── games/
│   │   ├── split-g/+page.svelte   # Split the G game
│   │   ├── dart/+page.svelte      # Dart game
│   │   └── jv/+page.svelte        # JV gambling game
│   └── leaderboard/
│       └── +page.svelte       # Live leaderboard
└── ...
```

## 🎨 Design Features

- Dark mode theme by default
- Smooth transitions and animations
- Mobile-optimized touch targets
- Real-time live indicator
- DaisyUI components for consistent UI

## 🔒 Security Notes

This is a friendly competition app with minimal security:

- Access code is hardcoded (1234)
- RLS policies allow all operations
- Session stored in localStorage
- Perfect for trusted friend groups!

## 📝 License

This is a personal project for friends. Use as you wish!

## 🤝 Contributing

This is a one-time event app, but feel free to fork and customize!

---

Built with ❤️ using SvelteKit, TailwindCSS, and Supabase

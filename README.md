# IronTrack

IronTrack is a React + Firebase workout tracker for managing workout templates, logging live training sessions, tracking personal records, and visualizing progress.

## Features

- Google sign-in with Firebase Auth
- Workout template builder with exercise autocomplete
- Live workout session tracking
- Automatic session history and total volume logging
- Personal record detection and storage
- Progress analytics with charts
- Custom confirmation modal for destructive actions
- Persistent in-progress workout state in `localStorage`

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Firebase Auth
- Cloud Firestore
- Recharts
- Motion
- Lucide icons

## Project Structure

- `src/main.tsx` - application entry point
- `src/App.tsx` - top-level router and authenticated layout
- `src/lib/AuthContext.tsx` - auth state, user profile sync, login/logout
- `src/lib/WorkoutContext.tsx` - active workout session state and Firestore writes
- `src/lib/firebase.ts` - Firebase initialization and shared helpers
- `src/lib/exerciseData.ts` - predefined exercise catalog
- `src/views/Dashboard.tsx` - summary dashboard
- `src/views/Templates.tsx` - template management
- `src/views/WorkoutActive.tsx` - live workout editor
- `src/views/History.tsx` - workout history
- `src/views/Progress.tsx` - analytics and charts
- `src/components/ErrorBoundary.tsx` - fallback UI for runtime errors

## Data Model

Firestore uses a user-scoped structure:

- `users/{userId}` - user profile and stats
- `users/{userId}/templates/{templateId}` - workout templates
- `users/{userId}/sessions/{sessionId}` - completed workout sessions
- `users/{userId}/prs/{exerciseId}` - personal records by exercise

Each user can only read and write their own data.

## Local Development

### Prerequisites

- Node.js
- Firebase project configuration

### Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local `.env` file using the variables in [.env.example](./.env.example)

3. Start the dev server:

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Available Scripts

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run preview` - preview the production build locally
- `npm run lint` - run TypeScript type checking
- `npm run clean` - remove the build output

## Notes

- Active workout sessions are persisted in browser storage so refreshes do not lose progress.
- Session completion updates the workout history, user stats, and PR records.
- The analytics screen derives chart data from Firestore session and PR documents.
- Firebase config is loaded from `VITE_FIREBASE_*` environment variables at build time.

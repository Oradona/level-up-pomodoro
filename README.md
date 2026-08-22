# Level Up Pomodoro

A full-stack Pomodoro timer with RPG-style progression, meaningful motivational messages, white noise, statistics, and a social friends system.

## Stack

- **Frontend:** Vue 3 + Vite + Pinia + Chart.js
- **Backend:** Node.js + Express + SQLite (`better-sqlite3`)
- **Auth:** JWT + bcryptjs
- **Storage:** SQLite for authenticated users, `localStorage` guest mode for offline-friendly usage

## Features

- Functional Pomodoro timer with focus, short break, and long break cycles
- Customizable focus/break durations persisted in `localStorage`
- XP and leveling system with level-up modal and motivational messages
- Guest mode with local persistence
- Authenticated mode with SQLite-backed session history
- Statistics dashboard with Chart.js visualizations
- Programmatic white noise generator using the Web Audio API
- Friends, friend requests, and stat comparison

## Project Structure

```
backend/   Express API + SQLite database
frontend/  Vue SPA powered by Vite
```

## Setup

### 1) Install backend dependencies

```bash
cd backend
npm install
```

### 2) Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 3) Run the backend

```bash
cd ../backend
npm start
```

The API runs on `http://localhost:3001`.

### 4) Run the frontend

```bash
cd ../frontend
npm run dev
```

The Vite app runs on `http://localhost:5173` and proxies API requests to the backend.

## Root Scripts

From the repository root:

```bash
npm run backend
npm run frontend
npm run build
npm run dev
```

## Default API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/sessions`
- `GET /api/sessions/stats`
- `GET /api/friends`
- `POST /api/friends`
- `POST /api/friends/request`
- `PUT /api/friends/:id/respond`
- `POST /api/ai/motivate`

## Notes

- Guest progress, timer settings, and local statistics are saved in the browser.
- Authenticated progress is synced to SQLite.
- White noise only plays during active focus sessions.

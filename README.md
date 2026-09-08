# 🚀 STREAKO - AI Habit Tracker

> Build habits that fit your **real life** — powered by AI coaching.

## Architecture

```
STREAKO/
├── backend/           # Node.js + Express API Server (Port 5000)
│   ├── config/        # Supabase clients, database helpers
│   ├── controllers/   # Auth, Habit, User, Analytics controllers
│   ├── middleware/     # Auth token validation, error handler
│   ├── models/        # User, Habit, HabitLog schemas
│   ├── routes/        # Modular route definitions
│   ├── services/      # Business logic layer
│   ├── utils/         # Validators, helpers
│   └── index.js       # API entry point
│
├── frontend/          # Static SPA Frontend (Port 3000)
│   ├── public/        # Static assets, HTML pages, index.html
│   │   ├── assets/    # Icons, images, fonts
│   │   └── pages/     # SPA route HTML templates
│   ├── src/           # Application source code
│   │   ├── components/  # Feature-organized UI components
│   │   ├── pages/       # Page-level component modules
│   │   ├── services/    # API client and service layers
│   │   ├── styles/      # CSS design system
│   │   ├── utils/       # Router, state, storage, helpers
│   │   ├── App.js       # Main application logic
│   │   └── index.js     # Entry point
│   └── index.js       # Express static file server
│
├── package.json       # Root orchestrator scripts
├── vercel.json        # Vercel deployment configuration
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase project with auth enabled

### Setup
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials
```

### Development
```bash
# Run both servers concurrently
npm run dev

# Or individually
npm run dev:backend   # API on http://localhost:5000
npm run dev:frontend  # UI  on http://localhost:3000
```

### Production (Vercel)
Push to main branch — Vercel auto-deploys using `vercel.json` config.

## API Endpoints

| Method | Endpoint              | Auth | Description           |
|--------|-----------------------|------|-----------------------|
| POST   | /api/auth/signup      | No   | Create new account    |
| POST   | /api/auth/login       | No   | Sign in               |
| POST   | /api/auth/logout      | No   | Sign out              |
| GET    | /api/auth/me          | Yes  | Get current user      |
| GET    | /api/habits           | Yes  | List all habits       |
| POST   | /api/habits           | Yes  | Create a habit        |
| POST   | /api/habits/:id/toggle| Yes  | Toggle completion     |
| DELETE | /api/habits/:id       | Yes  | Delete a habit        |
| GET    | /api/users/profile    | Yes  | Get user profile      |
| PUT    | /api/users/profile    | Yes  | Update profile        |
| GET    | /api/analytics/summary| Yes  | Get analytics         |
| GET    | /api/health           | No   | Health check          |

## Tech Stack

- **Backend**: Node.js, Express 5, Supabase (Auth + PostgreSQL)
- **Frontend**: Vanilla JS (ES Modules), CSS Custom Properties
- **Deployment**: Vercel (serverless functions + static)

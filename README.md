# Streako Frontend

Streako is a modern, dark-themed habit-tracking Single Page Application (SPA) built with pure vanilla HTML, CSS, and modular ES JavaScript.

## Architecture

```
streako-frontend/
├── index.html                 # SPA host shell
├── css/                       # Modular Design System
│   ├── variables.css          # Design system variables & color palette
│   ├── global.css             # Base reset & global layout utilities
│   ├── components.css         # Component-specific styles (buttons, cards, tags)
│   ├── layout.css             # Structure, grid, navbar, & sidebar styles
│   ├── animations.css         # Keyframe definitions & transitions
│   └── responsive.css         # Mobile/tablet responsiveness media queries
├── js/                        # ES Module Logic
│   ├── main.js                # Main application entrance
│   ├── router.js              # Client-side dynamic fetch router
│   ├── state.js               # Reactive global app state
│   ├── storage.js             # LocalStorage persistence wrapper
│   ├── components/            # Isolated component logic
│   └── utils/                 # General helpers (Dates, Formatting, Validators)
├── pages/                     # Sub-page HTML partials
└── assets/                    # Static graphics & iconography
```

## Running the Project

Since this project uses native ES Modules, simply run Vite or any static HTTP server:

```bash
npm run dev
```

<div align="center">

# 🇳🇵 NepseSage

### Professional-Grade Clinical Analysis Platform for the Nepal Stock Exchange

**NepseSage** transforms raw NEPSE market data into high-precision visual intelligence — combining institutional-grade market analytics, AI-powered insights, behavioral psychology tracking, and a risk-free trading simulator in a single, cohesive platform.


</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Data Pipeline](#data-pipeline)
- [Design System](#design-system)
- [Subscription Plans](#subscription-plans)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

NepseSage is a full-stack financial intelligence platform built specifically for the **Nepal Stock Exchange (NEPSE)**. It is designed around a **"Clinical Analyst"** philosophy: high data density, zero-latency interactions, and a professional aesthetic — giving retail investors the same toolset previously available only to institutional traders.

The platform covers the complete investor workflow:

- **Discover** — Live market data, sector performance, top movers, and company fundamentals.
- **Analyze** — Technical indicators (RSI, MACD, Bollinger Bands, SMA), chart series, and market depth.
- **Strategize** — AI-powered stock analysis and sentiment aggregation via the Sage AI engine.
- **Track** — Portfolio management with P&L metrics, historical value tracking, and a discipline score.
- **Learn** — A behavioral trading journal that identifies cognitive biases and psychological patterns.
- **Compete** — A paper-trading simulator and community leaderboard using real market data.
- **Share** — A community insights board where users post and discuss trade setups.

---

## Features

### 📊 Clinical Dashboard
The mission-control home screen for every investor session.
- Real-time portfolio value, cost basis, unrealized P&L, and return percentage.
- **Discipline Score** — a proprietary 0–100 metric that tracks adherence to the user's own trading plan.
- **Risk Meter** — live Portfolio Beta and volatility ratings.
- Market summary widget with NEPSE index, turnover, and advance/decline breadth.

### 📈 Market Intelligence
Complete NEPSE market data, always in sync.
- Market status (open/closed), live index value, total turnover, and sub-index breakdown.
- Top gainers, losers, and turnover leaders.
- Sector performance heatmap across all NEPSE-listed sectors.
- Symbol search with company fundamentals panel (EPS, P/E, book value, etc.).
- Floorsheet data for any traded symbol.

### 🔬 Technical Analysis
Professional-grade charting and indicator data.
- **OHLCV price history** for all symbols, stored and served from MongoDB for speed.
- Pre-computed EOD indicators: RSI, MACD, SMA-20/50/200, Bollinger Bands.
- Full chart-series arrays for multi-panel indicator rendering.
- Market depth (buyer/seller queue) for any symbol.
- Index history with configurable range (1M, 3M, 1Y, ALL) and advance/decline breadth series.

### 🤖 Sage AI
Groq-powered market intelligence (Llama 3.3 70B), contextualized for NEPSE.
- **Symbol Analyzer**: Input a ticker (e.g., `NICA`, `NTC`) and receive a structured technical + sentiment breakdown.
- **AI Chat**: Conversational interface for open-ended market questions.
- **Market Sentiment**: Aggregates NEPSE-wide sentiment signals.
- **Journal AI**: Automatically analyzes journal entries to detect behavioral patterns and emotional biases.

### 🧠 Behavior Lab (Trading Journal)
The psychological edge most platforms ignore.
- Log trades with emotional state, rationale, outcome, and free-form notes.
- Automatic **bias detection**: flags FOMO, Revenge Trading, Overconfidence, Anchoring, and more.
- **Discipline Heatmap**: GitHub-style calendar showing trading activity and discipline over time.
- **Psychological Sentiment Trend**: Line chart tracking emotional state across trading sessions.
- Discipline Score is recalculated after every journal entry.

### 🎮 Paper Trading Simulator
Risk-free strategy testing with real NEPSE prices.
- Start with a configurable virtual capital amount.
- Place buy/sell orders that execute at live-fetched market prices.
- View full order history and simulated portfolio performance.
- Reset anytime to start a new strategy run.

### 🏆 Leaderboard
Community accountability and competition.
- Ranks all simulator participants by portfolio performance.
- Encourages disciplined trading through transparent public scoring.

### 💡 Community Insights
A curated feed of trade ideas from the NepseSage community.
- Post bullish, bearish, or neutral insights tied to a specific symbol.
- Like and comment on insights from other analysts.
- Filter by sentiment or symbol.

---

## Architecture

NepseSage follows a **monorepo** structure separating concerns between a REST API backend and a Next.js frontend. The backend operates an automated data pipeline that ingests, normalizes, and serves live and historical NEPSE data.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│             Next.js 15 App Router + React 19                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express.js API Server                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Auth    │  │  NEPSE   │  │Portfolio │  │  Sage AI   │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Journal │  │Simulator │  │ Insights │  │Leaderboard │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                              │
│                  NEPSE Data Pipeline                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  nepseScheduler → nepseSyncService                     │  │
│  │       → nepseFetcher (@rumess/nepse-api)               │  │
│  │       → nepseAdapter (normalize + transform)           │  │
│  │       → MongoDB (persist)                              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Mongoose ODM
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                            │
│  Collections: users, marketdata, indexhistory, indexsnapshot │
│               portfolios, simulators, journalentries,        │
│               insights, comments                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  Groq API (Llama 3.3)   │
              └─────────────────────────┘
```

---

## Tech Stack

### Frontend (`/web-app`)

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 15 |
| Language | TypeScript (strict mode) | 5 |
| UI Library | React | 19 |
| Styling | Tailwind CSS | 4 |
| Component Library | Shadcn UI (Radix UI primitives) | Latest |
| Animation | Framer Motion | 11 |
| Charts | Recharts | 2 |
| Forms | React Hook Form + Zod | 7 + 3 |
| State | React Context API | — |
| HTTP Client | Fetch API (custom `services.ts`) | — |
| Fonts | Space Grotesk (heading), DM Sans (body) | — |

### Backend (`/server`)

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js (ES Modules) | 20+ |
| Framework | Express.js | 5 |
| Language | JavaScript (ESM) | — |
| Database | MongoDB + Mongoose ODM | 9 |
| Authentication | JSON Web Tokens (JWT) | 9 |
| Password Hashing | Bcryptjs | 3 |
| AI Integration | Groq SDK (Llama 3.3 70B) | Latest |
| NEPSE Data | @rumess/nepse-api | 1 |
| Scheduler | node-cron | 4 |
| Validation | Zod | 4 |

---

## Project Structure

```
NepseSage/
│
├── server/                          # Express.js Backend
│   ├── src/
│   │   ├── app.js                   # Entry point — Express app, CORS, route mounting
│   │   ├── config/
│   │   │   └── db.js                # MongoDB connection (Mongoose)
│   │   │
│   │   ├── controllers/             # Business logic, request/response handlers
│   │   │   ├── aiController.js      # Groq — stock analysis, chat, sentiment
│   │   │   ├── authController.js    # Register, login, profile, plan management
│   │   │   ├── insightController.js # Community insights CRUD, likes, comments
│   │   │   ├── journalController.js # Trade journal entries, discipline, bias stats
│   │   │   ├── leaderboardController.js  # Simulator performance rankings
│   │   │   ├── nepseController.js   # Market data — summary, symbols, movers, history
│   │   │   ├── portfolioController.js    # Portfolio CRUD, transaction history
│   │   │   └── simulatorController.js   # Paper trading — orders, reset, balances
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # JWT verification (protect guard)
│   │   │   ├── errorMiddleware.js   # Global error handler + 404 handler
│   │   │   └── validateMiddleware.js # Zod schema validation middleware
│   │   │
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.js              # User — auth, preferences, plan, discipline score
│   │   │   ├── MarketData.js        # OHLCV + technicals per symbol
│   │   │   ├── IndexHistory.js      # Daily NEPSE index time series
│   │   │   ├── IndexSnapshot.js     # Latest index state snapshot
│   │   │   ├── Portfolio.js         # User portfolio holdings
│   │   │   ├── JournalEntry.js      # Trade journal entries with emotion/bias data
│   │   │   ├── Simulator.js         # Paper trading account + orders
│   │   │   ├── Insight.js           # Community insight posts
│   │   │   └── Comment.js           # Comments on insights
│   │   │
│   │   ├── pipeline/                # Automated NEPSE data ingestion
│   │   │   ├── nepseScheduler.js    # node-cron job definitions (startup, intraday, EOD)
│   │   │   ├── nepseSyncService.js  # Orchestration — coordinates fetch → adapt → persist
│   │   │   ├── nepseFetcher.js      # Calls @rumess/nepse-api for live data
│   │   │   └── nepseAdapter.js      # Normalizes raw API responses to DB schema
│   │   │
│   │   ├── routes/                  # Express router definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── nepseRoutes.js
│   │   │   ├── portfolioRoutes.js
│   │   │   ├── journalRoutes.js
│   │   │   ├── simulatorRoutes.js
│   │   │   ├── aiRoutes.js
│   │   │   ├── insightRoutes.js
│   │   │   └── leaderboardRoutes.js
│   │   │
│   │   ├── services/
│   │   │   ├── technicalAnalysis.js # RSI, MACD, SMA, Bollinger Band computation
│   │   │   └── disciplineService.js # Discipline score calculation logic
│   │   │
│   │   └── utils/
│   │       ├── generateToken.js     # JWT signing helper
│   │       ├── schemas.js           # Shared Zod validation schemas
│   │       └── sectorNormalizer.js  # Maps NEPSE sector names → canonical categories
│   │
│   ├── scripts/
│   │   ├── seedCompanyMaster.js     # One-time/weekly company metadata seeding
│   │   ├── backfillHistory.js       # Backfill historical OHLCV for all symbols
│   │   └── test_nepse.js            # Manual NEPSE API connectivity test
│   │
│   ├── .env                         # Environment variables (see below — DO NOT COMMIT)
│   └── package.json
│
└── web-app/                         # Next.js 15 Frontend
    ├── src/
    │   ├── app/                     # Next.js App Router
    │   │   ├── layout.tsx           # Root layout — fonts, ThemeProvider
    │   │   ├── globals.css          # OKLCH design tokens, Tailwind base
    │   │   ├── (auth)/              # Auth route group (no sidebar)
    │   │   │   ├── login/page.tsx
    │   │   │   └── signup/page.tsx
    │   │   └── (dashboard)/         # Authenticated route group (with sidebar)
    │   │       ├── market/          # Market overview page
    │   │       ├── companies/       # All listed companies
    │   │       ├── companyDetails/[symbol]/  # Individual company deep-dive
    │   │       ├── sectors/         # Sector performance page
    │   │       ├── sage-ai/         # AI chat and analysis interface
    │   │       ├── journal/         # Trading journal & behavior lab
    │   │       ├── simulator/       # Paper trading simulator
    │   │       ├── insights/        # Community insights board
    │   │       ├── leaderboard/     # Simulator leaderboard
    │   │       ├── settings/        # User preferences and profile
    │   │       └── upgrade/         # Pro plan upgrade page
    │   │
    │   ├── components/
    │   │   ├── dashboard/           # Dashboard widgets (P&L, discipline score, risk meter)
    │   │   ├── market/              # Market summary, charts, movers, floorsheet, depth
    │   │   ├── journal/             # Journal table, heatmap, sentiment trend, entry sheet
    │   │   ├── sage-ai/             # AI chat input, message renderer, context sheet
    │   │   ├── insights/            # Insights feed, create/edit forms
    │   │   ├── navigation/          # Navbar, Sidebar, Footer
    │   │   ├── notifications/       # Notification panel
    │   │   ├── search/              # Global command-palette search
    │   │   ├── shared/              # AuthGuard, ThemeProvider, UpgradeNudge
    │   │   └── ui/                  # Shadcn UI primitives (50+ components)
    │   │
    │   ├── context/
    │   │   ├── AuthContext.tsx      # JWT auth state — login, logout, user object
    │   │   └── PortfolioContext.tsx # Portfolio data — holdings, transactions
    │   │
    │   ├── hooks/
    │   │   ├── useNepse.ts          # Market data fetching hooks
    │   │   ├── useJournal.ts        # Journal CRUD hooks
    │   │   ├── usePortfolio.ts      # Portfolio mutation hooks
    │   │   ├── useSimulator.ts      # Simulator order hooks
    │   │   └── use-mobile.tsx       # Responsive breakpoint detection
    │   │
    │   └── lib/
    │       ├── services.ts          # All API call functions (typed)
    │       ├── api.ts               # Axios/Fetch base client with auth header injection
    │       └── utils.ts             # Tailwind `cn()` merge utility
    │
    ├── .env.local                   # Frontend environment variables (see below)
    ├── next.config.js
    ├── tailwind.config.ts
    └── package.json
```

---

## API Reference

All API endpoints are prefixed with `/api`. Protected routes require a `Bearer <token>` Authorization header.

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Register a new user. Body: `{ name, email, password }` |
| `POST` | `/auth/login` | Public | Login and receive a JWT. Body: `{ email, password }` |
| `GET` | `/auth/me` | 🔒 | Get the current authenticated user's profile. |
| `PUT` | `/auth/me` | 🔒 | Update profile (name, avatar, risk tolerance, trading goal, watchlist). |
| `PUT` | `/auth/change-password` | 🔒 | Change password. Body: `{ currentPassword, newPassword }` |
| `POST` | `/auth/upgrade` | 🔒 | Upgrade account to Pro plan. |
| `POST` | `/auth/downgrade` | 🔒 | Downgrade account to Free plan. |

### Market Data — `/api/nepse`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/nepse/summary` | Public | NEPSE index, turnover, advances/declines, last updated. |
| `GET` | `/nepse/status` | Public | Whether market is currently open or closed. |
| `GET` | `/nepse/search?q=<query>` | Public | Search symbols by ticker or company name. |
| `GET` | `/nepse/symbols` | Public | Alias for `/search` (backward compatible). |
| `GET` | `/nepse/symbol/:symbol` | Public | Full details for a single symbol (price, fundamentals, sector). |
| `GET` | `/nepse/gainers` | Public | Top gaining stocks for the current session. |
| `GET` | `/nepse/losers` | Public | Top losing stocks for the current session. |
| `GET` | `/nepse/turnover` | Public | Highest turnover stocks. |
| `GET` | `/nepse/sectors` | Public | Sector-wise performance aggregation. |
| `GET` | `/nepse/history/:symbol` | Public | Daily OHLCV price history from DB. |
| `GET` | `/nepse/price-volume-history/:symbol` | Public | Price and volume history for charting. |
| `GET` | `/nepse/technical/:symbol` | Public | Latest pre-computed indicator values (RSI, MACD, SMA, BB). |
| `GET` | `/nepse/chart-series/:symbol` | Public | Full indicator arrays for multi-panel chart rendering. |
| `GET` | `/nepse/index-history?range=1M\|3M\|1Y\|ALL` | Public | NEPSE index time-series by range. |
| `GET` | `/nepse/index-history/breadth` | Public | Daily advance/decline series. |
| `GET` | `/nepse/sub-indices` | Public | Sub-index breakdown (Banking, Hydropower, etc.). |
| `GET` | `/nepse/floorsheet` | Public | Live floorsheet (rate-limited). |
| `GET` | `/nepse/depth/:symbol` | Public | Market depth (order book) for a symbol. |
| `GET` | `/nepse/today-volume-history` | Public | Intraday volume history for today. |
| `POST` | `/nepse/sync/:symbol` | 🔒 | Manually trigger a price sync for a symbol. |
| `POST` | `/nepse/backfill-sectors` | 🔒 | Admin: backfill sector data for all symbols. |

### Portfolio — `/api/portfolio`

All endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/portfolio/` | Get the current user's portfolio with live P&L calculations. |
| `GET` | `/portfolio/transactions` | Get full transaction history. |
| `GET` | `/portfolio/history` | Get historical portfolio value over time. |
| `POST` | `/portfolio/transaction` | Add a transaction. Body: `{ symbol, type: 'buy'|'sell', quantity, price, date }` |
| `POST` | `/portfolio/bulk-transactions` | Add multiple transactions in one request. |
| `DELETE` | `/portfolio/transaction/:id` | Delete a transaction by ID. |

### Trading Journal — `/api/journal`

All endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/journal/` | Get all journal entries for the current user. |
| `GET` | `/journal/discipline` | Get the user's current discipline score and breakdown. |
| `GET` | `/journal/biases` | Get detected bias summary (FOMO, revenge trading, etc.). |
| `GET` | `/journal/emotions` | Get emotion statistics across all journal entries. |
| `POST` | `/journal/` | Create a new journal entry. |
| `GET` | `/journal/:id` | Get a single journal entry. |
| `PUT` | `/journal/:id` | Update a journal entry. |
| `DELETE` | `/journal/:id` | Delete a journal entry. |

### Sage AI — `/api/ai`

All endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/analyze` | Analyze a stock symbol. Body: `{ symbol, context? }` |
| `POST` | `/ai/chat` | Send a message to the AI chat. Body: `{ message, history? }` |
| `POST` | `/ai/journal-analysis` | Run AI analysis on a journal entry. Body: `{ entryId }` |
| `GET` | `/ai/sentiment` | Get AI-aggregated market-wide sentiment. |

### Paper Trading Simulator — `/api/simulator`

All endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/simulator/` | Get simulator account state (balance, holdings, P&L). |
| `GET` | `/simulator/orders` | Get full order history. |
| `POST` | `/simulator/order` | Place a paper trade. Body: `{ symbol, type: 'buy'|'sell', quantity }` |
| `POST` | `/simulator/reset` | Reset the simulator account to initial capital. |

### Community Insights — `/api/insights`

All endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/insights/` | Get all public insights (paginated). |
| `GET` | `/insights/mine` | Get the current user's insights. |
| `POST` | `/insights/` | Create an insight. Body: `{ symbol, sentiment: 'bullish'|'bearish'|'neutral', text, isPublic? }` |
| `PUT` | `/insights/:id` | Update an insight. |
| `DELETE` | `/insights/:id` | Delete an insight. |
| `POST` | `/insights/:id/like` | Toggle like on an insight. |
| `GET` | `/insights/:id/comments` | Get comments on an insight. |
| `POST` | `/insights/:id/comments` | Post a comment. |
| `DELETE` | `/insights/:id/comments/:commentId` | Delete a comment. |

### Leaderboard — `/api/leaderboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/leaderboard/` | 🔒 | Get ranked list of all simulator participants. |

---

## Data Pipeline

The NEPSE data pipeline is the backbone of NepseSage, running automatically without any manual intervention.

### Pipeline Layers

```
@rumess/nepse-api  →  nepseFetcher  →  nepseAdapter  →  MongoDB
   (Live API)         (HTTP calls)     (normalize)      (persist)
```

1. **`nepseFetcher.js`** — Makes HTTP requests to the NEPSE API via the `@rumess/nepse-api` package. Handles retries and response validation.
2. **`nepseAdapter.js`** — Normalizes raw API responses into the internal MongoDB schema. Handles sector normalization, data type coercion, and missing field defaults.
3. **`nepseSyncService.js`** — Orchestrates the full sync lifecycle: prices, index snapshots, sub-indices, symbol histories, technical indicators, and company metadata.
4. **`nepseScheduler.js`** — Defines all cron schedules. All times are in **Nepal Time (UTC+5:45)**.

### Cron Schedule

| Schedule | Time (NPT) | Days | Task |
|----------|-----------|------|------|
| Startup | On boot | Any | `runStartupSync()` — backfill missed days, warm DB cache |
| Every 5 min | 11:00–15:00 | Sun–Thu | Price sync, index snapshot, sub-indices |
| Pre-market | 10:50 | Sun–Thu | Cache warmup before market open |
| End-of-day | 15:30 | Sun–Thu | Full EOD pipeline (see order below) |
| Weekly | 10:30 | Sunday | Company master metadata deep refresh |

### EOD Pipeline Order

The end-of-day sync follows a strict order to preserve data integrity:

```
1. appendIndexHistory()       ← Lock in today's confirmed index close FIRST
2. syncAllPrices()            ← May zero volumes for non-traded symbols
3. syncIndexSnapshot()        ← Refresh latest index state
4. syncSubIndices()           ← Refresh sub-index breakdown
5. syncAllSymbolHistories()   ← Full OHLCV for every active symbol
6. syncTechnicals()           ← Pre-compute RSI, MACD, SMA, Bollinger Bands
7. seedCompanyMaster()        ← Refresh metadata (new listings, delistings)
```

> **Important**: `appendIndexHistory()` must always run before `syncAllPrices()`. After market close, `syncAllPrices()` may zero out the volume/turnover fields in `MarketData` for symbols that did not trade. The `IndexSnapshot` collection is used as a fallback for the summary API when `MarketData` is zeroed.

---

## Design System

NepseSage uses a **Clinical Navy** design language that prioritizes data density and readability over decorative aesthetics.

### Color Palette (OKLCH)

Colors are defined as OKLCH CSS custom properties, enabling perfect perceptual uniformity across light and dark modes. The palette is configured in `globals.css` using Tailwind CSS v4's CSS variable system.

### Typography

| Role | Font | Tailwind Class |
|------|------|---------------|
| Headings, labels, metrics | Space Grotesk | `font-heading` |
| Body, dense data, tables | DM Sans | `font-sans` |

### Motion

Micro-interactions are handled by **Framer Motion** with hardware-accelerated transforms. Animations are subtle, purposeful, and never block data readability.

### Component Library

All UI primitives come from **Shadcn UI**, built on top of Radix UI for full accessibility compliance (ARIA, keyboard navigation, focus management). Components are copied into `src/components/ui/` and can be customized directly.

---

## Subscription Plans

| Feature | Free | Pro |
|---------|------|-----|
| Market data & charts | ✅ | ✅ |
| Portfolio tracking (up to 10 holdings) | ✅ | ✅ |
| Portfolio tracking (unlimited) | ❌ | ✅ |
| Trading journal (up to 20 entries) | ✅ | ✅ |
| Trading journal (unlimited) | ❌ | ✅ |
| Sage AI (limited queries) | ✅ | ✅ |
| Sage AI (unlimited) | ❌ | ✅ |
| Behavioral bias detection | ✅ | ✅ |
| Technical indicator charts | ❌ | ✅ |
| Community insights | ✅ | ✅ |
| Paper trading simulator | ✅ | ✅ |
| Priority data sync | ❌ | ✅ |

Plan state is stored on the `User` model (`plan: 'free' | 'pro'`) with `planActivatedAt` and `planExpiresAt` timestamps.

---

## Scripts

### Backend Scripts (`server/scripts/`)

These are one-off utility scripts for database maintenance. Run from the `server/` directory.

**Seed Company Master**

Fetches and upserts all listed company metadata (name, sector, instrument type) from NEPSE.

```bash
cd server
node scripts/seedCompanyMaster.js
```

**Backfill Historical Prices**

Fetches full OHLCV history for every active symbol and persists it to MongoDB. Use this when setting up a new instance to pre-populate price history.

```bash
cd server
node scripts/backfillHistory.js
```

**Test NEPSE API Connectivity**

Verifies that the `@rumess/nepse-api` can reach the NEPSE data source and returns a sample response.

```bash
cd server
node scripts/test_nepse.js
```

### Frontend Scripts (`web-app/`)

```bash
npm run dev      # Start Next.js development server with hot reload
npm run build    # Production build
npm run start    # Start production server (requires build first)
npm run lint     # ESLint check
npm run format   # Prettier format all files
```

---

## Contributing

Contributions, bug reports, and feature requests are welcome.

1. **Fork** the repository.
2. **Create** a feature branch: `git checkout -b feat/your-feature-name`
3. **Commit** your changes: `git commit -m 'feat: add your feature'`
4. **Push** to the branch: `git push origin feat/your-feature-name`
5. **Open** a Pull Request.

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation change
- `style:` — Formatting, no logic change
- `refactor:` — Code restructuring
- `chore:` — Maintenance tasks

---

## License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ for the Nepali investor community by **Dipal Katuwal**

</div>

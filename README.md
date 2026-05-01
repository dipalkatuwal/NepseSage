# NEPSE Sage AI 🇳🇵

**NEPSE Sage AI** is a professional-grade clinical analysis platform for the Nepal Stock Exchange. It transforms raw market data into high-precision visual intelligence, combining an institutional-grade UI with advanced AI behavioral insights.

---

## 🏛️ Architecture & Context

NEPSE Sage AI has evolved into a full-stack **MERN-like** architecture, utilizing **Next.js 15 (App Router)** for the frontend and an **Express.js / Node.js** server for the backend, powered by **MongoDB**. It is designed with a **"Clinical Analyst"** philosophy: high-density data, zero-latency interactions, and a professional navy aesthetic.

### 🧠 Core Intelligence
- **Behavioral Analysis**: Tracks "Discipline Scores" and identifies cognitive biases (FOMO, Revenge Trading) via the Journal.
- **AI Engine**: A specialized interface for symbol analysis (e.g., NICA, NTC) and sentiment aggregation using OpenAI.
- **Data Density**: UI is optimized for professional utility, using Space Grotesk for readability and DM Sans for dense data.

---

## 🚀 Module Breakdown

### 📊 Clinical Dashboard (`/`)
The mission control for investors.
- **Real-time Portfolio Health**: Value tracking and P/L metrics.
- **Discipline Score**: Proprietary metric rating adherence to trading plans.
- **Risk Meter**: Live Portfolio Beta and volatility ratings.

### 🤖 Sage AI (`/sage-ai`)
The analytical core.
- **Technical Analyst**: Support/resistance detection and indicator interpretation.
- **Sentiment Engine**: Aggregates NEPSE trends and accumulation signals.

### 🧪 Behavior Lab (`/journal`)
The trading psychologist.
- **Emotional Logging**: Tracks mental state during trades.
- **Pattern Recognition**: Flags "Red Flag" behaviors automatically.

### 🎮 Simulator (`/simulator`)
- **Virtual Capital**: Risk-free strategy testing with real market data.

---

## 🛠️ Technical Stack & Primitives

### Frontend (`/web-app`)
- **Framework**: Next.js 15 (App Router, Server Components)
- **Styling**: Tailwind CSS 4 + Shadcn UI (Radix UI)
- **Visuals**: Framer Motion (Micro-interactions) + Recharts (Financial charts)
- **Type Safety**: Zod (Schema validation) + TypeScript (Strict mode)

### Backend (`/server`)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB (Mongoose 9 ODM)
- **Authentication**: JWT (JSON Web Tokens) & Bcryptjs for secure password hashing
- **AI Integration**: OpenAI SDK for market sentiment and analysis
- **Task Scheduling**: Node-cron for background jobs

---

## 📁 Developer Guide: Project Structure

The project is structured as a monorepo containing both the frontend and backend.

```text
/
├── server/                 # Express.js Backend
│   ├── src/
│   │   ├── config/         # Environment and DB configuration
│   │   ├── controllers/    # Route logic and request handling
│   │   ├── middleware/     # Custom middlewares (auth, error handling)
│   │   ├── models/         # Mongoose schemas (User, Portfolio, Journal)
│   │   ├── routes/         # API endpoint definitions
│   │   ├── services/       # Core business logic and external API integrations
│   │   ├── utils/          # Helper functions
│   │   └── app.js          # Express app entry point
│   └── package.json        # Backend dependencies
│
└── web-app/                # Next.js 15 Frontend
    ├── src/
    │   ├── app/            # Next.js App Router (pages & layouts)
    │   ├── components/     # Reusable UI components (Shadcn, AppLayout)
    │   ├── context/        # React Context providers (AuthContext)
    │   ├── hooks/          # Custom React hooks (use-mobile)
    │   └── lib/            # Utilities (Tailwind merging, API clients)
    └── package.json        # Frontend dependencies
```

---

## 🎨 Design Language (Clinical Navy)

The design system enforces a premium, anti-generic UI:
- **Calibrated Color**: OKLCH-based colors for perfect light/dark mode transitions.
- **Micro-Motion**: Hardware-accelerated transitions via Framer Motion.
- **Typography**: `font-heading` (Space Grotesk) for impact; `font-sans` (DM Sans) for utility.

---

## ⚙️ Development Workflow

To run the full stack locally, you need two terminal instances.

### 1. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
*The server will run on port 5000 (or the port defined in `.env`).*

### 2. Start the Frontend Application
```bash
cd web-app
npm install
npm run dev
```
*The web app will run on port 3000.*

### Environment Variables
You will need `.env` files in both directories.
- **`/server/.env`**: Needs `MONGO_URI`, `JWT_SECRET`, `PORT`, and `OPENAI_API_KEY`.
- **`/web-app/.env.local`**: Needs `NEXT_PUBLIC_API_URL` pointing to the backend (e.g., `http://localhost:5000/api`).

---

## 📝 Usage for AI Tools
If pasting this into another AI for development:
> "This is a full-stack Next.js 15 (App Router) and Express.js project using MongoDB. The frontend uses Shadcn UI, Tailwind 4, and follows a 'Clinical Analyst' aesthetic with Space Grotesk typography. The backend handles JWT authentication, portfolio management, and journal entries. Prioritize performance, data density, and secure API integration between the Next.js frontend and Express backend."

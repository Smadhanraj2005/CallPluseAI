# CallPulse AI 📞⚡
> **Next-Gen AI Sales Dialer, Call Intelligence & Live Conversation Coach**

CallPulse AI is a full-stack sales dialer and call intelligence platform built to make outbound calling faster, smarter, and effortless for sales teams. Powered by **Google Gemini 3.7 Flash**, CallPulse provides real-time AI objection handling during calls, automatic post-call AI statements, voice-to-text transcripts, and detailed call sentiment analytics.

---

## ✨ Features at a Glance

### 📱 1. Smart Sales Dialer
- Softphone keypad with DTMF audio feedback, live call timers, mute, hold, and disposition tagging.
- Instant lead switching and one-click dialing directly from the leads queue.
- Live call recording simulation with waveform visualizer and audio playback controls.

### 🤖 2. Live AI Pitch Coach & Objection Handler
- Real-time objection assistant powered by Gemini AI.
- Get instant, battle-tested counter-rebuttals during live calls for common sales objections (Price, Competitors, Timing, Not Interested, etc.).
- Custom objection input for on-the-fly handling.

### 📝 3. Automatic "AI Call Statement" Generator
- Automatically generates a clean, structured post-call statement after every call ends:
  - **Customer Statement**: Clear 1-2 line summary of what the customer actually said (supports both **Simple English** and **Tamil-English / Tanglish** mix!).
  - **Interest Level Badge**: High, Medium, Low, or Not Interested.
  - **Key Points Noted**: Captured follow-up requests, budget concerns, or feature requirements.
  - **Suggested Next Action**: Concrete next step for the rep (e.g. *"Call back tomorrow at 11 AM"*).
- Includes an **"Edit Statement"** button so salespeople can refine notes in seconds.

### 📊 4. Call Sentiment & Analytics
- Live speech-to-text transcription engine.
- Overall sentiment scoring (Positive / Neutral / Negative) with 3D sentiment radar charts and conversation breakdown.
- Metrics dashboard for managers tracking total calls, talk time, conversion rates, and sales rep performance leaderboard.

### 👥 5. Role-Based Access Control & Manager Workflows
- Separate views for **Managers** and **Sales Representatives**.
- Managers can assign leads, track team productivity, and inspect call history recordings.
- Reps get a streamlined interface focused on dialing, logging notes, and managing assigned leads.

### 🌙 6. Modern Adaptive UI
- Fully responsive light and dark themes.
- Custom soft neon cyan and purple glows in dark mode for high legibility and a slick developer/sales aesthetic.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Node.js, Express
- **AI Engine**: Google Gemini API (`@google/genai` with `gemini-3.7-flash`)
- **Build Tool**: Vite, esbuild (`tsx` in dev)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js (v18+) installed on your system.

### 1. Clone the Repository

```bash
git clone https://github.com/Smadhanraj2005/CallPluseAI.git
cd CallPluseAI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory (or copy `.env.example`):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:3000` to run the app.

---

## 📜 Available Scripts

- `npm run dev`: Starts the Express + Vite server in development mode on port 3000.
- `npm run build`: Bundles the Vite frontend and builds the Express server into `dist/server.cjs`.
- `npm run start`: Runs the production build server.
- `npm run lint`: Runs TypeScript type checking.

---

## 📂 Project Structure

```
├── server.ts                 # Express backend server with Gemini AI API endpoints
├── src/
│   ├── components/           # Reusable UI components (AiCallStatementCard, Header, Sidebar, etc.)
│   ├── context/              # Lead & Theme Context providers (State management)
│   ├── pages/                # Main application screens
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── DialerPage.tsx
│   │   ├── LeadsPage.tsx
│   │   ├── CallHistoryPage.tsx
│   │   ├── CallSentimentPage.tsx
│   │   ├── ManagerAssignPage.tsx
│   │   └── ReportsPage.tsx
│   ├── types.ts              # Global TypeScript interfaces & types
│   ├── utils/                # Audio DTMF synthesizers and audio helpers
│   ├── App.tsx               # Main layout router
│   └── main.tsx              # React entry point
└── package.json
```

---

## 🤝 Contributing

Contributions, feedback, and pull requests are always welcome! Feel free to open an issue if you find a bug or have a feature suggestion.

Made with ❤️ for sales reps and sales teams.

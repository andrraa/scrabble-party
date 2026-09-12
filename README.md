# 🎮 Scrabble Online — 2-Player Realtime Multiplayer Game

<p align="center">
  <img src="src/lib/assets/favicon.svg" alt="Scrabble Logo" width="96" height="96" />
</p>

<p align="center">
  <b>Modern, Clean, & Responsive 2-Player Scrabble Game built with Svelte 5 & PartyKit.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v0.1.0-blue.svg?style=flat-square" alt="Version v0.1.0" />
  <img src="https://img.shields.io/badge/Svelte-5.x_Runes-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Realtime-PartyKit_/_Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="PartyKit" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Dictionary-Collins_CSW24_(280k_Words)-amber?style=flat-square" alt="Collins CSW24 Dictionary" />
  <img src="https://img.shields.io/badge/Audio-Web_Audio_API-blue?style=flat-square" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License MIT" />
</p>

---

## ✨ Key Features

### 🎯 Complete Scrabble Engine & Gameplay
- **Official Tournament Lexicon (Collins CSW24)**: Packed with 280,887 official English words verified with instant $O(1)$ in-memory server lookups.
- **Comprehensive Move Validation**:
  - Continuous straight-line checks (horizontal or vertical).
  - First-move validation: must cover the center star $(7, 7)$.
  - Subsequent move validation: must connect with existing board tiles.
  - Automatic extraction of main words and all concurrent cross-words.
- **Automatic Scoring System**:
  - Letter multipliers (`DL` $\times 2$, `TL` $\times 3$).
  - Word multipliers (`DW` $\times 2$, `TW` $\times 3$, `Center Star` $\times 2$).
  - **Bingo** bonus ($+50$ points for playing all 7 rack tiles in a single turn).
- **Wildcard Blank Tile**: Modal dialog to pick letters A–Z when placing blank tiles.
- **Full Player Actions**: *Play Word*, *Pass Turn*, *Swap Tiles* (exchange with bag), *Recall Tiles*, and *Shuffle Rack*.
- **Flexible Rack Organization**: Drag-and-drop or click-to-swap tiles on your rack at any time, even during your opponent's turn.

### ⚡ Realtime & Serverless Architecture (Anti-Cheat)
- **PartyKit (Cloudflare Workers & Durable Objects)**: Low-latency room state synchronization over WebSockets.
- **Server-Authoritative Anti-Cheat**: Opponent rack tiles are masked server-side (`?`) to prevent client-side inspection.
- **Seamless Reconnection**: Automatic player session recovery across browser refreshes or network drops.
- **Single-Player vs AI Bot**: Solo practice mode with an AI engine that finds high-scoring valid moves.

### 📱 Modern & Responsive Design (Mobile, Tablet, Desktop)
- **Fluid Multi-Device Layout**:
  - **Desktop / Laptop**: Single-screen view (zero scroll) with scoreboard, unseen tile tracker, and history sidebar.
  - **Tablet**: Balanced layout with comfortable touch targets.
  - **Mobile Smartphone**: Full-bleed 15x15 board, fixed 7-slot tile rack without horizontal scrolling, and slide-over move history drawer.
- **Realtime Score & Word Preview**: Instant live preview of formed words and estimated scores before submitting moves.
- **Procedural Sound Effects (Web Audio API)**: Synthesized wooden tile clacks, shuffles, success chimes, and bingo fanfare (includes mute toggle).
- **Tournament Turn Timer**: Configurable turn deadlines (Off, 60s, 90s, 120s, 180s) with digital pulse countdown warnings.
- **Quick Reaction Emotes**: Floating speech-bubble animations above player score cards (👍, 🔥, 💡, 👏, GG).
- **Glassmorphic Floating Alerts**: Unobtrusive floating toasts that keep the board layout stable.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | [SvelteKit](https://kit.svelte.dev/) (Svelte 5 Runes), TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), shadcn-svelte inspired UI |
| **Realtime Backend** | [PartyKit](https://partykit.io/) (Cloudflare Workers / Durable Objects) |
| **Dictionary** | Collins Scrabble Words (CSW24, 280,887 entries) |
| **Audio** | Native Web Audio API (procedural synthesis, 0 external assets) |

---

## 📁 Project Structure

```text
scrabble-online/
├── party/
│   ├── index.ts                # PartyKit server (Room state management, timer, moves, emotes)
│   ├── dictionary-loader.ts    # O(1) Set-based dictionary loader
│   └── words-packed.ts         # Bundled Collins CSW24 280k wordlist
├── src/
│   ├── lib/
│   │   ├── audio/
│   │   │   └── sound-effects.ts# Procedural Web Audio API sound synthesizer
│   │   ├── components/
│   │   │   ├── ui/             # Reusable UI primitives (Button, Card, Badge, Input)
│   │   │   ├── Board.svelte    # Scrabble 15x15 board grid
│   │   │   ├── Cell.svelte     # Multiplier cells (TW, DW, TL, DL, Center)
│   │   │   ├── Tile.svelte     # Ivory wooden tiles with subscript point values
│   │   │   ├── Rack.svelte     # 7-slot rack stand, live preview, action buttons
│   │   │   ├── ScoreBoard.svelte# Player score cards, countdown timer, & emote display
│   │   │   ├── GameLog.svelte  # Turn-by-turn move history log
│   │   │   ├── BlankDialog.svelte # Wildcard letter selection dialog
│   │   │   ├── SwapDialog.svelte  # Bag tile swap dialog
│   │   │   └── GameOverModal.svelte# Final match result modal
│   │   ├── engine/
│   │   │   ├── board-constants.ts# Multiplier coordinates, letter distribution, & values
│   │   │   ├── validator.ts    # Geometry validation, word adjacency, and scoring engine
│   │   │   └── bot.ts          # AI Bot Scrabble solver & move selector
│   │   ├── partykit/
│   │   │   └── client.ts       # PartySocket client connection wrapper
│   │   └── types.ts            # TypeScript definitions for GameState, Player, & Messages
│   └── routes/
│       ├── +layout.svelte      # Root layout & Favicon
│       ├── +page.svelte        # Lobby page (Create/Join room, Solo AI Bot match)
│       └── game/[code]/
│           └── +page.svelte    # Main Scrabble game view
├── partykit.json               # PartyKit configuration
├── package.json
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm / pnpm / yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/andrraa/scrabble-party.git
cd scrabble-party
npm install
```

### 2. Start PartyKit WebSocket Server
In Terminal 1:
```bash
npm run dev:party
# PartyKit server runs on http://localhost:1999
```

### 3. Start SvelteKit Frontend
In Terminal 2:
```bash
npm run dev
# Open http://localhost:5173 in your browser
```

> **Testing Multi-player**: Open `http://localhost:5173` in two separate browser tabs or windows. Create a match in tab 1 (Host), copy the Room Code, and join from tab 2 (Player 2).

---

## 🌐 Deployment (Cloudflare Workers & Pages)

The game runs at the edge using **PartyKit on Cloudflare Workers & Durable Objects**.

### Deploy Backend (Cloudflare Worker)
```bash
CLOUDFLARE_ACCOUNT_ID="<account_id>" CLOUDFLARE_API_TOKEN="<token>" npx wrangler deploy
```

### Deploy Frontend (Vercel / Cloudflare Pages)
Add environment variable:
- `PUBLIC_PARTYKIT_HOST` = `<your-worker-or-partykit-domain>`

---

## 📖 Scrabble Rules & Scoring Reference

1. **Tile Distribution**: 100 standard tiles with point values ranging from 0 (Blank) to 10 (Q, Z).
2. **First Move**: Must consist of 2 or more letters and cross the center star `(7, 7)`.
3. **Board Multipliers**:
   - `DL` (Double Letter): Multiplies the value of that newly placed tile by 2.
   - `TL` (Triple Letter): Multiplies the value of that newly placed tile by 3.
   - `DW` (Double Word): Multiplies the total score of the newly formed word by 2.
   - `TW` (Triple Word): Multiplies the total score of the newly formed word by 3.
4. **Bingo Bonus**: Playing all 7 tiles from your rack in a single turn awards a $+50$ point bonus!

---

<p align="center">
  Made with ❤️ by <b>ARP</b>
</p>

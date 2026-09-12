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

## ✨ Fitur Unggulan

### 🎯 Gameplay & Engine Scrabble Lengkap
- **Kamus Resmi Tournament (Collins CSW24)**: Memuat 280.887 kata valid resmi bahasa Inggris dengan verifikasi instan $O(1)$ in-memory di sisi server.
- **Validasi Langkah Komprehensif**:
  - Pengecekan garis lurus kontinu (horizontal / vertikal).
  - Validasi langkah pertama wajib menutupi kotak pusat $(7, 7)$.
  - Validasi langkah lanjutan wajib terhubung dengan kepingan lama di papan.
  - Ekstraksi otomatis kata utama dan seluruh kata silang (*cross-words*).
- **Sistem Skor Otomatis**:
  - Multiplier huruf (`DL` $\times 2$, `TL` $\times 3$).
  - Multiplier kata (`DW` $\times 2$, `TW` $\times 3$, `Center Star` $\times 2$).
  - Bonus **Bingo** ($+50$ poin jika memainkan seluruh 7 keping sekaligus).
- **Wildcard Blank Tile**: Modal dialog pemilihan huruf A–Z saat meletakkan kepingan kosong.
- **Tindakan Pemain**: *Play Word*, *Pass Turn*, *Swap Tiles* (tukar keping ke kantong), *Recall Tiles*, dan *Shuffle Rack*.
- **Pengaturan Rak Kapan Saja**: Fleksibel menukar (*click-to-swap*) atau menggeser (*drag-and-drop*) posisi kepingan di rak sendiri bahkan saat menunggu giliran lawan.

### ⚡ Realtime & Serverless Architecture (Anti-Cheat)
- **PartyKit (Cloudflare Workers & Durable Objects)**: Sinkronisasi status ruangan dengan latensi super rendah (*low-latency WebSockets*).
- **Server Authoritative Anti-Cheat**: Rack kepingan lawan disembunyikan dari inspeksi client dan divalidasi langsung di server.
- **Resilience Reconnect**: Sesi pemain tersimpan secara otomatis, aman saat *refresh* atau ganti koneksi.
- **Single Player vs AI Bot**: Mode latihan offline/online melawan bot Scrabble dengan pencarian kata terbaik.

### 📱 Desain Modern & Responsif (Mobile, Tablet, Desktop)
- **Fluid Multi-Device Layout**:
  - **Desktop / Laptop**: Tampilan *Single-Screen View (Zero Scroll)* dengan kartu skor dan riwayat di sidebar kanan.
  - **Tablet**: Tata letak seimbang dengan *touch-target* yang lapang dan nyaman.
  - **Mobile Smartphone**: Papan 15x15 *full-bleed* tanpa koordinat yang memakan tempat, kepingan rak *fixed 7-slot* bebas scroll horizontal, dan drawer log riwayat.
- **Estimasi Skor Realtime (*Live Word Preview*)**: Menampilkan pratinjau kata yang terbentuk dan estimasi skor sebelum tombol *Play Word* ditekan.
- **Audio Feedback Realistis (*Web Audio API*)**: Efek suara sintetis ketukan kayu, *shuffle*, *chime* sukses, dan *fanfare* bingo (dilengkapi tombol Mute).
- **Turn Timer Turnamen**: Pilihan batas waktu giliran (Off, 60s, 90s, 120s, 180s) dengan peringatan *pulse* digital.
- **Quick Reaction Emotes**: Balon percakapan animasi melayang di atas kartu skor pemain (👍, 🔥, 💡, 👏, GG).
- **Glassmorphism Floating Alert**: Notifikasi transparan modern yang melayang tanpa menggeser elemen tata letak papan.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | [SvelteKit](https://kit.svelte.dev/) (Svelte 5 Runes), TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), shadcn-svelte design system |
| **Realtime Backend** | [PartyKit](https://partykit.io/) (Cloudflare Workers / Durable Objects) |
| **Dictionary** | Collins Scrabble Words (CSW24, 280.887 entri kata) |
| **Audio** | Native Web Audio API (Synthesized procedurally, zero external assets) |

---

## 📁 Struktur Direktori

```text
scrabble-online/
├── party/
│   ├── index.ts                # Server PartyKit (Room state management, timer, emotes)
│   ├── dictionary-loader.ts    # O(1) Set-based dictionary loader
│   └── words-packed.ts         # Bundled Collins CSW24 280k official wordlist
├── src/
│   ├── lib/
│   │   ├── audio/
│   │   │   └── sound-effects.ts# Procedural Web Audio API sound synthesizer
│   │   ├── components/
│   │   │   ├── ui/             # Shadcn-style components (Button, Card, Badge, Input)
│   │   │   ├── Board.svelte    # Papan Scrabble 15x15 clean grid
│   │   │   ├── Cell.svelte     # Kotak sel multiplier (TW, DW, TL, DL, Center)
│   │   │   ├── Tile.svelte     # Kepingan kayu ivory dengan subscript poin
│   │   │   ├── Rack.svelte     # Rak 7 slot, live preview, aksi, & emotes
│   │   │   ├── ScoreBoard.svelte# Papan skor, turn countdown timer, & emote bubble
│   │   │   ├── GameLog.svelte  # Riwayat perolehan kata turn-by-turn
│   │   │   ├── BlankDialog.svelte # Modal pemilihan huruf wildcard
│   │   │   ├── SwapDialog.svelte  # Modal penukaran keping ke kantong
│   │   │   └── GameOverModal.svelte# Modal hasil akhir pertandingan
│   │   ├── engine/
│   │   │   ├── board-constants.ts# Posisi multiplier, nilai huruf, & tile distribution
│   │   │   ├── validator.ts    # Algoritma validasi geometris, sambungan kata, & skor
│   │   │   └── bot.ts          # AI Bot Scrabble logic & word finder
│   │   ├── partykit/
│   │   │   └── client.ts       # PartySocket client connection wrapper
│   │   └── types.ts            # Definisi TypeScript GameState, Player, & Messages
│   └── routes/
│       ├── +layout.svelte      # Root layout & Favicon
│       ├── +page.svelte        # Halaman awal (Lobby create/join, loading splash)
│       └── game/[code]/
│           └── +page.svelte    # Arena permainan Scrabble
├── partykit.json               # Konfigurasi PartyKit
├── package.json
└── README.md
```

---

## 🚀 Panduan Menjalankan Lokal (Development)

### Prasyarat
- Node.js versi 18+ (Disarankan v20+)
- npm / pnpm / yarn

### 1. Clone & Install Dependencies
```bash
git clone <URL_REPOSITORY>
cd scrabble-online
npm install
```

### 2. Jalankan PartyKit Server (Backend WebSocket)
Di Terminal 1:
```bash
npm run dev:party
# Server PartyKit aktif di http://localhost:1999
```

### 3. Jalankan Frontend SvelteKit
Di Terminal 2:
```bash
npm run dev
# Buka http://localhost:5173 di browser
```

> **Tips Uji Coba**: Buka `http://localhost:5173` pada dua tab atau browser berbeda. Buat game di tab 1 (Host), lalu salin Room Code dan bergabunglah di tab 2 (Player 2).

---

## 🌐 Panduan Deployment (Cloudflare Workers & Pages)

Aplikasi ini berjalan cepat di tepi jaringan (*edge*) menggunakan **PartyKit / Cloudflare Workers & Durable Objects**.

### Deploy Backend (Cloudflare Worker)
```bash
CLOUDFLARE_ACCOUNT_ID="<account_id>" CLOUDFLARE_API_TOKEN="<token>" npx wrangler deploy
```

---

## 📖 Aturan & Perhitungan Poin Scrabble

1. **Distribusi Kepingan**: Terdapat total 100 kepingan huruf standar dengan nilai poin dari 0 (Blank) hingga 10 (Q, Z).
2. **Langkah Pertama**: Wajib terdiri dari minimal 2 huruf dan menutupi kotak bintang pusat `(7, 7)`.
3. **Multiplier Papan**:
   - `DL` (Double Letter): Nilai huruf baru dikalikan 2.
   - `TL` (Triple Letter): Nilai huruf baru dikalikan 3.
   - `DW` (Double Word): Nilai total kata baru dikalikan 2.
   - `TW` (Triple Word): Nilai total kata baru dikalikan 3.
4. **Bingo**: Pemain yang berhasil memainkan ketujuh (7) keping di raknya dalam satu langkah mendapatkan tambahan bonus $+50$ poin!

---

<p align="center">
  Made with ❤️ by <b>ARP</b>
</p>

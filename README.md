# Oman National Day · العيد الوطني العُماني

An interactive, bilingual (English / Arabic) website celebrating Oman National Day on 20 November.

**Live:** https://oman-national-day-six.vercel.app

## Features
- **Greeting card maker** with 4 designs, Arabic or English messages, and download or share as PNG
- **Photo frame** in Oman's colours with 3 styles. Photos never leave the device.
- **History of Oman:** an animated timeline from ancient Magan to today, plus a "put the events in order" game
- **Quiz:** 10 random questions, 20 seconds each, one attempt per person, and a live shared leaderboard
- **Wish wall:** shared wishes with likes, a full-screen display mode for event screens, and organiser moderation
- Countdown to National Day, right-to-left Arabic support, and automatic language choice based on the visitor's device

## Tech
- A single `index.html` (vanilla HTML, CSS and JavaScript, canvas rendering)
- Vercel serverless functions in `api/`
- Upstash Redis for the leaderboard and wish wall
- Server-side rules: unique names, one play per device, score validation, link blocking and rate limits

## API
| Endpoint | Purpose |
|---|---|
| `GET /api/leaderboard` | Top 10, total players, and this device's result |
| `POST /api/start` | Reserve a name and device, start an attempt |
| `POST /api/score` | Save progress after each answer (scores can only go up) |
| `GET/POST /api/wishes` | List or post wishes |
| `POST /api/wish-like` | Toggle a like |
| `POST /api/reset`, `POST /api/wish-delete` | Organiser only (`ADMIN_KEY`) |

## Run / deploy
Opened directly as a file, the page works offline and stores everything in the browser.
To deploy: `vercel deploy --prod`. This needs the Upstash integration env vars and `ADMIN_KEY` set in Vercel.

## Organiser tools
Open the site with `?admin` to reset the leaderboard or delete wishes. You'll be asked for the organiser key.

---
© 2026 Talal Alyafai. All rights reserved.

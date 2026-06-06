# UltraGol - Liga MX Football Streaming and Information Platform

## Run & Operate
- **Run Main Server:** `npm start` (starts `server.js` on port 5000)
- **Run ULTRA Server:** `cd ULTRA && npm start` (starts `ULTRA/server.js` on port 5000)
- **Required Env Vars:** `PORT`, `SESSION_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `NODE_ENV`
- **Reels Scraper:** `node server/reels-scraper.js` (runs every 90 mins, output to `data/reels-scraped.json`)

## Stack
- **Frontend:** Pure HTML5, CSS3, Vanilla JavaScript (ES6+), PWA, Web Components
- **Backend:** Node.js, Express.js 5.x
- **Database:** Google Firestore (NoSQL), Firebase Authentication, Firebase Storage
- **Payments:** PayPal SDK, Stripe SDK
- **Build Tool:** _Populate as you build_

## Where things live
- **Main Server Entry:** `server.js`
- **ULTRA Server Entry:** `ULTRA/server.js`
- **DB Schema:** Google Firestore collections (`users`, `streams`, `comments`, `notifications`, `donations`, `match_links`)
- **Static Data:** `data/standings.json`, `data/teams.json`, `data/fixtures.json`, `data/jornadas.json`, `data/videos-highlights.json`, `data/reels.json` (fallback), `data/reels-scraped.json` (live cache)
- **Reels Scraper Logic:** `server/reels-scraper.js`
- **Reels Frontend:** `js/reels-viewer.js`, `css/reels-viewer.css`
- **PWA Manifests:** `manifest.json` (main site), `ULTRA/manifest.json` (ULTRA platform)
- **Main Site Styles:** various `.css` files in root and subdirectories
- **ULTRA Site Styles:** `ULTRA/css/style.css`, `ULTRA/css/dark.css`
- **Aggregator Brand Pages:**
    - Pelota Libre: `/mx/index.html`, `/mx/:slug`
    - Roja Directa: `/rojadirecta/index.html`, `/rojadirecta/:slug`

## Architecture decisions
- **Hybrid Data Storage:** Static JSON for stable data (teams, historical records) to minimize Firebase costs, Firebase for dynamic and user-generated content requiring real-time updates.
- **PWA First:** Extensive PWA implementation with service workers and manifests for offline capabilities and native-like installation.
- **Vanilla JS Frontend:** Avoids framework overhead for faster load times and smaller bundle sizes, prioritizing browser native features.
- **Dual Server Instances:** Separate Express servers for the main website and the ULTRA streaming platform to manage distinct functionalities and resource allocation.
- **TikTok Scraper:** Custom server-side scraper for TikTok videos, ensuring relevant and fresh "Reels" content.

## Product
- Live streaming discovery for Liga MX matches
- Real-time match information, statistics, and standings
- User authentication and profile management
- Social features: comments, sharing
- Donation system (PayPal, Stripe)
- Personalized push notifications for favorite teams
- TikTok-style video reels with Liga MX content
- Two premium match aggregator brand pages (`/mx` and `/rojadirecta`)

## User preferences
Preferred communication style: Simple, everyday language.

## Gotchas
- **Reels Data Expiration:** TikTok signed URLs for video reels expire, necessitating the 90-minute scraper refresh.
- **PWA Install Banner:** The PWA install banner has a 7-day dismissal memory; be mindful of this during testing.
- **CORS:** Both server instances have CORS enabled; ensure proper configuration if deploying to different domains.
- **Firebase Quotas:** Be aware of Firebase quotas for Firestore reads/writes, especially with real-time data.

## Pointers
- **Firebase Documentation:** [https://firebase.google.com/docs](https://firebase.google.com/docs)
- **PayPal Developer Docs:** [https://developer.paypal.com/docs](https://developer.paypal.com/docs)
- **Stripe API Reference:** [https://stripe.com/docs/api](https://stripe.com/docs/api)
- **Express.js Guide:** [https://expressjs.com/](https://expressjs.com/)
- **PWA Fundamentals:** [https://web.dev/pwq/](https://web.dev/pwq/)
- **ULTRAGOL Statistics API:** [https://ultragol-api-3-six.vercel.app/](https://ultragol-api-3-six.vercel.app/)
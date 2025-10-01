# UltraGol - Liga MX Platform

## Overview
UltraGol is a professional sports platform for Liga MX (Mexican Football League) featuring real-time statistics, live streaming links, team information, and comprehensive match data.

**Created by:** L3HO  
**Last Updated:** October 01, 2025

## Project Architecture

### Tech Stack
- **Backend:** Node.js with Express
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Database:** Firebase (Firestore, Authentication, Storage)
- **Payment Integration:** PayPal, Stripe
- **Port:** 5000 (main app), 3000 (ULTRA live streaming)

### Project Structure
```
/
├── server.js              # Main Express server
├── index.html             # Homepage
├── css/                   # Stylesheets
├── js/                    # Client-side JavaScript
├── data/                  # JSON data files (fixtures, standings, teams)
├── assets/                # Team logos and images
├── ULTRA/                 # Live streaming sub-app
│   ├── server.js         # ULTRA server (port 3000)
│   └── index.html        # ULTRA frontend
└── server/
    └── paypal.js         # PayPal integration

```

### Key Features
1. **Live Standings:** Real-time Liga MX standings table
2. **Team Profiles:** Detailed team information and statistics
3. **Match Calendar:** Fixture schedule and results
4. **Statistics:** Advanced analytics and metrics
5. **Live Streaming:** UltraGol LIVE for match broadcasts
6. **Donations:** PayPal integration for platform support
7. **Firebase Integration:** User authentication, data storage, and notifications

### Configuration
- Server binds to `0.0.0.0:5000` for Replit compatibility
- CORS enabled with `origin: true` for proxy support
- Cache headers disabled for development (`Cache-Control: no-cache`)
- Helmet security middleware configured
- Session management with express-session

### Environment Variables (Optional)
- `PORT` - Server port (default: 5000)
- `ULTRA_PORT` - ULTRA server port (default: 3000)
- `SESSION_SECRET` - Session encryption key
- `PAYPAL_CLIENT_ID` - PayPal integration
- `PAYPAL_CLIENT_SECRET` - PayPal integration
- `NODE_ENV` - Environment (production/development)

## Recent Changes

### October 01, 2025 - Initial Replit Setup
- Imported from GitHub repository
- Installed dependencies for main app and ULTRA subdirectory
- Configured server to run on port 5000
- Verified application loads correctly
- Set up workflow for main server
- Configured deployment settings

## Development Notes
- The application uses Firebase for backend services (already configured in code)
- PayPal integration is optional and requires credentials
- Static data files in `/data/` folder contain Liga MX information
- ULTRA subdirectory is a separate app for live streaming features

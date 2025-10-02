# UltraGol - Football Streaming and Information Platform

## Overview

UltraGol is a comprehensive Spanish-language football platform focused on Liga MX, created by L3HO. The platform combines live streaming capabilities, real-time match information, team statistics, user authentication, and social features. It serves as a centralized hub for football fans to discover streams, track their favorite teams, engage with the community, and support the platform through donations.

The application consists of two main components:
1. **Main Website** - Liga MX information portal with team data, standings, calendars, and statistics
2. **ULTRA Platform** - Live streaming discovery and sharing platform with user-generated content

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- Pure HTML5, CSS3, and vanilla JavaScript (no framework dependencies)
- Modern ES6+ modules for code organization
- Responsive design with mobile-first approach
- Progressive Web App (PWA) capabilities

**Design System:**
- **Main Site**: Orange (#ff9933) and blue gradient theme with professional sports aesthetics
- **ULTRA Platform**: Black, green (#00ff41), and orange theme with modern dark UI
- Custom CSS variables for consistent theming
- Glassmorphism effects and modern animations throughout
- Typography: Space Grotesk, Inter, and JetBrains Mono fonts

**Key Frontend Components:**
- Multi-page application with dedicated pages for teams, standings, calendars, statistics, news, and donations
- Interactive team profiles with detailed statistics and match history
- Advanced calendar system with jornada (matchday) and monthly views
- Real-time match tracking with live updates
- User authentication UI with registration, login, and profile management
- Comments and social interaction features
- Picture-in-picture video player for floating stream viewing
- Cookie consent banner (GDPR compliant)

### Backend Architecture

**Server Framework:**
- Express.js 5.x for HTTP server
- Two separate server instances:
  - Main server (`server.js`) on port 5000 - handles main website
  - ULTRA server (`ULTRA/server.js`) on port 5000 - handles streaming platform
- CORS enabled for cross-origin requests
- Static file serving with cache control headers
- Session management with express-session

**API Endpoints:**
- `/api/paypal/orders` - Create PayPal donation orders
- `/api/paypal/orders/:id/capture` - Capture completed PayPal payments
- `/api/paypal/config` - Retrieve PayPal configuration
- `/api/stripe/*` - Stripe payment integration endpoints
- `/api/cookie-consent` - Cookie consent management

**Security Measures:**
- Helmet.js for HTTP security headers
- Cookie parser for secure cookie handling
- Session secret management via environment variables
- Content Security Policy configuration
- HTTPS-only cookies in production

### Data Storage

**Firebase Integration:**
- **Firestore Database**: Real-time NoSQL database for user data, streams, comments, notifications
- **Firebase Authentication**: Email/password and Google OAuth authentication
- **Firebase Storage**: User avatars, team logos, and media uploads
- **Collections**:
  - `users` - User profiles with favorite teams and preferences
  - `streams` - Live stream submissions and metadata
  - `comments` - User comments on matches and content
  - `notifications` - User notification queue
  - `donations` - Donation transaction records
  - `match_links` - Community-shared streaming links

**Static Data Files (JSON):**
- `data/standings.json` - League standings and team statistics
- `data/teams.json` - Team information, colors, logos, history
- `data/fixtures.json` - Match schedules and results
- `data/jornadas.json` - Matchday schedules and dates
- `data/videos-highlights.json` - Video highlights and YouTube embeds

**Data Architecture Decisions:**
- Static JSON files for relatively stable data (teams, historical records) to reduce database costs
- Firebase for dynamic, user-generated content requiring real-time updates
- Local storage for user preferences and session state
- No SQL database currently in use (architecture supports future PostgreSQL via Drizzle if needed)

### Authentication System

**Multi-Provider Authentication:**
- Email/password registration and login
- Google OAuth integration
- Session persistence across page reloads
- Real-time auth state observation

**User Profile System:**
- Custom user profiles with favorite team selection
- Avatar upload and management
- User statistics tracking (posts, likes, comments)
- Achievement and badge system
- Follower/following relationships

**Authorization:**
- Admin role system with privileged access
- User-specific content (my streams, my profile)
- Comment ownership verification for edit/delete
- Protected routes requiring authentication

### Third-Party Service Integration

**Payment Processing:**
1. **PayPal Integration** (Primary):
   - PayPal Server SDK v1.1.0
   - Sandbox and production environment support
   - Order creation and capture flow
   - Dynamic button rendering
   - Webhook support for payment verification

2. **Stripe Integration** (Alternative):
   - Stripe SDK v18.5.0
   - Card payment processing
   - Subscription management ready
   - Secure payment intent flow

**Video and Media:**
- YouTube embedded videos for highlights
- Custom video player with Picture-in-Picture support
- Iframe-based live stream embedding
- Browser popup windows for floating video

**External Links:**
- UltraGol LIVE external platform integration
- Social media sharing capabilities
- External streaming service links

## External Dependencies

### NPM Packages (Main Project)
- `express` (^5.1.0) - Web server framework
- `cors` (^2.8.5) - Cross-origin resource sharing
- `helmet` (^8.1.0) - Security middleware
- `cookie-parser` (^1.4.7) - Cookie parsing
- `express-session` (^1.18.2) - Session management
- `@paypal/paypal-server-sdk` (^1.1.0) - PayPal payment processing
- `stripe` (^18.5.0) - Stripe payment processing

### NPM Packages (ULTRA Platform)
- `express` (^4.21.2) - Web server
- `cors` (^2.8.5) - CORS middleware

### CDN Dependencies
- **Firebase SDK** (v9.22.0 and v10.7.1):
  - firebase-app-compat.js
  - firebase-auth-compat.js
  - firebase-firestore-compat.js
  - firebase-storage-compat.js
  - Modular SDK for ULTRA platform
- **Font Awesome** (v6.0.0) - Icon library
- **Google Fonts**:
  - Roboto (multiple weights)
  - Space Grotesk
  - Inter
  - JetBrains Mono
  - Playfair Display

### Firebase Services
- **Project**: ligamx-daf3d
- **Authentication**: Email/password, Google OAuth
- **Firestore**: Real-time database
- **Storage**: File uploads and media
- **Hosting**: Authorized domains for authentication

### External APIs
- YouTube API (for video embeds)
- PayPal REST API
- Stripe API
- Google OAuth API

### Environment Configuration
Required environment variables:
- `PORT` - Server port (default: 5000)
- `SESSION_SECRET` - Session encryption key
- `PAYPAL_CLIENT_ID` - PayPal client identifier
- `PAYPAL_CLIENT_SECRET` - PayPal secret key
- `STRIPE_SECRET_KEY` - Stripe API secret
- `NODE_ENV` - Environment (development/production)

### Deployment Platform
- Configured for Replit deployment
- Autoscale deployment type
- Host binding to 0.0.0.0 for external access
- Cache control headers for fresh content delivery
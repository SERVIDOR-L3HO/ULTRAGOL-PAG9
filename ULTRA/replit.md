# ULTRAGOL - Football Streaming Platform

## Overview
ULTRAGOL is a Spanish football streaming platform created by L3HO that allows users to share and discover live football streams. It serves as a backup platform for sharing football transmissions when the main ULTRAGOL application fails.

## Current State
- ✅ Successfully imported from GitHub and configured for Replit
- ✅ Dependencies installed (Express.js, CORS)
- ✅ Server running successfully on port 5000 with proper Replit configuration
- ✅ Frontend and backend integrated as a single-page application
- ✅ Firebase integration configured for real-time stream data
- ✅ Deployment configuration set up for production (autoscale)
- ✅ Application fully functional and ready to use

## Recent Changes (November 27, 2025)
- ✅ **NEW**: Added "Eliminar caché" (Clear Cache) button in settings panel
  - Located in the Configuración (Settings) panel
  - Shows confirmation dialog before clearing cache
  - Clears browser cache, localStorage, sessionStorage, and unregisters Service Workers
  - Automatically reloads the page after clearing
  - Warning message about losing saved design and configuration

## Previous Changes (September 29, 2025)
- ✅ **FRESH PROJECT IMPORT COMPLETED**: Successfully set up from GitHub import
- ✅ Installed Node.js dependencies (Express.js, CORS) via npm install
- ✅ Fixed missing dependencies issue and restarted server workflow
- ✅ Verified server configuration for Replit environment on port 5000
- ✅ Confirmed proper CORS and host configuration (0.0.0.0)
- ✅ Tested application functionality - all features working perfectly
- ✅ **NEW**: Picture-in-Picture (PIP) functionality for floating video
  - Separate browser popup window (can be moved outside the main browser)
  - Remains visible even when minimizing the main browser
  - Fully resizable and movable window
  - Professional design with live badge and loading indicator
  - Works independently from the main page
- ✅ **NEW**: Creative visual enhancements for live stream section
  - Animated glow effects around video iframe
  - Pulsing "EN VIVO" indicator with drop shadows
  - Shimmer effects on info bar
  - Animated progress bar at top of video
  - Border glow animations
  - Enhanced PIP button with gradient and pulse animation
- ✅ **NEW**: Added GOLAZOZ collaboration banner to live stream section
- ✅ **NEW**: Implemented creative improvements throughout the website
- ✅ **NEW**: Added modern animations, effects, and visual enhancements
- ✅ Configured deployment settings for production (autoscale deployment)
- ✅ Verified Firebase integration and security rules are properly configured
- ✅ Application fully operational and ready for production deployment
- **Previous**: Complete UI redesign with modern design system
- **Previous**: Black, orange, and white color scheme
- **Previous**: Modern typography and glassmorphism effects

## Project Architecture

### Backend (Express.js)
- **File**: `server.js`
- **Port**: 5000 (configured for Replit)
- **Host**: 0.0.0.0 (allows external connections)
- **Features**:
  - CORS enabled with credentials support
  - Cache control headers for proper caching behavior
  - Static file serving for frontend assets
  - SPA routing support

### Frontend (Vanilla HTML/CSS/JS)
- **Main Files**: `index.html`, `styles.css`, `app.js`
- **Features**:
  - Spanish language interface
  - Two main sections: Stream viewing and stream upload
  - Platform filtering (YouTube, Instagram, TikTok, Facebook, Twitch)
  - Real-time stream updates
  - Automatic stream expiration (1 hour)

### Database (Firebase)
- **Configuration**: `firebase-config.js`
- **Project ID**: ligamx-daf3d
- **Services**: Firestore for stream data storage
- **Collections**: 'streams' collection with stream metadata

### Key Features
1. **Stream Sharing**: Users can upload stream links with metadata
2. **Live Filtering**: Filter streams by platform
3. **Auto-expiration**: Streams automatically removed after 1 hour
4. **Real-time Updates**: Uses Firebase onSnapshot for live data
5. **Responsive Design**: Mobile-friendly interface
6. **GOLAZOZ Collaboration**: Official partnership banner in live stream section
7. **Creative Enhancements**: Modern animations, glow effects, and interactive elements
8. **Picture-in-Picture Mode**: Floating video window with drag/resize functionality
   - Native PIP support for compatible browsers
   - Custom floating window fallback
   - Draggable and resizable interface
   - Minimize/close controls

## Dependencies
- express: ^4.21.2
- cors: ^2.8.5
- Firebase SDK (loaded via CDN): 10.7.1

## Environment Configuration
- Configured for Replit hosting environment
- Uses environment PORT variable or defaults to 5000
- CORS configured to allow all origins for development
- Cache control headers prevent browser caching issues

## Next Steps for Production
- Configure deployment settings
- Verify Firebase security rules
- Test stream upload and viewing functionality
- Monitor Firebase quota usage
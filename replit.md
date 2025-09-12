# UltraGol - Liga MX Sports Platform

## Overview

UltraGol is a comprehensive sports platform focused on Liga MX (Mexican football league) that provides real-time match information, team statistics, user profiles, and live streaming capabilities. The platform is built as a multi-page web application with Firebase backend integration and includes features like user authentication, social interactions, comments system, and live match streaming through the UltraGol LIVE sub-application.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Multi-page Application (MPA)**: Traditional web application with separate HTML pages for different sections (index.html, teams.html, standings.html, calendario.html, etc.)
- **Vanilla JavaScript**: No frontend frameworks - uses pure JavaScript with ES6 modules for component management
- **CSS Organization**: Modular CSS with separate files for main styles, animations, teams, and Firebase features
- **Responsive Design**: Mobile-first approach with hamburger navigation and adaptive layouts

### Backend Architecture  
- **Static File Serving**: Primary content served as static files with JSON data sources
- **Node.js/Express Server**: Used specifically for the ULTRA sub-application (live streaming module)
- **Client-side Data Processing**: JavaScript handles data manipulation and API calls from the frontend

### Data Storage Solutions
- **Firebase Firestore**: Real-time database for user profiles, comments, notifications, match links, and social features
- **Firebase Authentication**: User registration, login, and session management
- **Firebase Storage**: File uploads for user avatars and media content
- **Static JSON Files**: League data, team information, standings, and fixtures stored as static JSON files in `/data` folder

### Authentication and Authorization
- **Firebase Auth**: Email/password authentication with real-time auth state monitoring
- **Role-based Access**: Admin dashboard functionality with predefined admin users
- **Session Management**: Persistent login state across page refreshes and browser sessions

### External Service Integrations
- **Firebase SDK**: Complete Firebase suite including Auth, Firestore, and Storage
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Typography (Roboto font family)
- **Real-time Updates**: Firebase real-time listeners for live data synchronization

### Key Architectural Decisions

**Hybrid Static/Dynamic Approach**: Static files for core league data with Firebase for user-generated content provides fast loading while enabling social features.

**Modular JavaScript Architecture**: Separate JS modules for different features (auth.js, teams.js, standings.js, etc.) allows for better code organization and maintenance.

**Sub-application Pattern**: UltraGol LIVE exists as a separate Node.js application within the `/ULTRA` directory, providing backup streaming functionality with its own server and Firebase configuration.

**Progressive Enhancement**: Core functionality works without JavaScript, with enhanced features requiring Firebase connectivity.

## External Dependencies

### Third-party Services
- **Firebase**: Complete backend-as-a-service including Authentication, Firestore database, and Cloud Storage
- **CDN Resources**: Font Awesome icons and Google Fonts served from external CDNs

### APIs and Data Sources
- **Firebase Firestore**: Real-time database for user data, comments, notifications
- **Firebase Authentication**: User management and session handling
- **Static JSON APIs**: Local data files for teams, standings, fixtures, and match information

### Development Dependencies
- **Node.js**: Runtime for the ULTRA sub-application server
- **Express.js**: Web framework for serving the streaming application
- **CORS**: Cross-origin resource sharing middleware for the Express server

### Frontend Libraries
- **Firebase SDK**: Client-side Firebase integration (v9.22.0 and v10.7.1)
- **Font Awesome**: Icon library (v6.0.0)
- **Google Fonts**: Roboto font family for typography
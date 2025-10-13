# QUERO FRETES - Sistema de Gestão de Fretes

## Overview
QUERO FRETES is a comprehensive, subscription-based, full-stack web application for freight management. It streamlines operations related to drivers, vehicles, clients, and freight requests. The platform aims to be a central hub for all logistics stakeholders in Brazil, enhancing efficiency and connectivity.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend utilizes React with TypeScript, Vite, Wouter for routing, and TanStack React Query for state management. UI components are built with Radix UI and styled using Tailwind CSS, prioritizing a clean, functional design with a custom sidebar color (`#00222d`) and white fonts. Mobile optimization is achieved with a `use-mobile.ts` hook for responsive layouts.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite, Wouter, TanStack React Query, Radix UI, Tailwind CSS, React Hook Form, Zod, Context-based authentication.
- **Backend**: Node.js with TypeScript, Express.js (RESTful API), Passport.js (local strategy, Express session), custom middleware for authentication, authorization, and subscription validation (role-based access control), Zod for validation.
- **Database**: PostgreSQL (Neon Database), Drizzle ORM for type-safe queries and migrations.

### Feature Specifications
- **User Management**: Multi-role system (administrators, drivers, shippers, agents, carriers) with email/password authentication (scrypt hashing) and profile management.
- **Subscription Management**: Integrates with OpenPix for PIX payments, supporting trial periods and webhook-based status updates. All non-driver/admin users require an active subscription immediately.
- **Freight Management**: Creation, tracking, and management of freight requests, including multi-destination support.
- **Vehicle & Driver Management**: Registration and association of drivers (with CNH validation) and vehicles.
- **Email Service**: Nodemailer for transactional emails.
- **Real-time Data**: React Query for automatic updates; OpenPix integration for real-time financial data.
- **Quotation System**: Detailed forms, status tracking, and PDF report generation for registered and public users.
- **ANTT Calculator**: Rebuilt adhering to PORTARIA SUROC Nº 23/2025, with direct distance input.
- **AI Assistant**: OpenAI GPT-4o ("Buzino") for transport-related queries with subscription-based usage limits.
- **Admin Features**: Comprehensive interface for user management, financial oversight, webhook configuration, and advanced user search.
- **Name Validation System**: Automatic cleaning of user names during registration.
- **Registration/Login Flow**: Redesigned multi-step registration (Personal Data → Company Data → Access credentials) and simplified login, with infrastructure for phone verification.
- **User Dashboard**: Displays key metrics, recent freights, subscription status, and quick access links.
- **Performance & Stability**: Implemented idempotent initialization pattern to prevent infinite re-renders in forms, optimized freights page filters with IBGE API integration for city search, redesigned freight cards for responsive display, and fixed login redirection issues.

### System Design Choices
The application is fully containerized using Docker, with a multi-stage Node.js 20 Alpine Dockerfile and a `docker-compose.yml` for the complete stack (PostgreSQL, Nginx, application). It includes SSL configuration, health checks, and a production-ready setup.

## External Dependencies

- **Payment Gateway**: OpenPix
- **Email Services**: Nodemailer, Ethereal Email (development)
- **Database Hosting**: Neon Database (PostgreSQL)
- **Development & Deployment**: Replit, Docker, Vite, TypeScript
- **AI Integration**: OpenAI (GPT-4o)
- **Automation**: N8N
- **Analytics**: Google Analytics
- **Validation**: ReceitaWS API (CNPJ validation)
- **Mapping/Geocoding**: IBGE API (for city search/autocomplete)

## Recent Updates

### User Dashboard Panel (October 13, 2025)
Created comprehensive user dashboard panel showing key metrics and information:
- Performance metrics cards (total freights, views, interested drivers)
- User freights section with last 5 posted freights
- Subscription status display with expiration alerts
- User data display (name, email, WhatsApp, account creation date)
- Quick access links to main features

### Freight Management Actions (October 13, 2025)
Added action buttons in dashboard and made freight cards clickable:
- Dashboard actions: Edit, Activate/Deactivate, and Delete buttons for each freight
- Delete confirmation dialog
- Toggle activation (adds/removes 30 days to expiration date)
- Removed Edit, View, and Delete icon buttons from freight list
- Made entire freight card clickable to view details
- Kept only WhatsApp share and contact buttons in freight list

### Freight Analytics & Tracking (October 13, 2025)
Implemented comprehensive tracking system for freight views and interested drivers:
- Added `views` and `interestedDrivers` columns to freights table
- Created API endpoints to track freight views and driver interest
- Automatic view tracking when users open freight details page
- Interest tracking when users click WhatsApp contact buttons
- Real-time metrics display in dashboard showing:
  - Total views across all user freights
  - Total interested drivers (WhatsApp clicks)
  - Average metrics per freight
- Tracking works on both public freight pages and freight listing pages

### Automatic Client Creation on Registration (October 13, 2025)
Implemented automatic client record creation for companies during user registration:
- Made address fields optional in clients table (street, number, neighborhood, city, state, zipcode)
- Automatic client creation for all users with CNPJ (embarcador, transportador, agenciador)
- Smart CNPJ handling: reuses existing client if CNPJ already registered, creates new otherwise
- Proper clientId linking to user record with session propagation
- Client type automatically determined based on user profile type
- Logs all client creation/linking activities for monitoring

### Client Logo Display in Freight Listings (October 13, 2025)
Implemented client logo display system for freight listings:
- Created `getClientsByIds()` method for batch client lookups (optimized with SQL IN clause)
- Modified freight listing API to fetch associated client logos when users have `clientId`
- Logo resolution hierarchy: client logoUrl → user avatarUrl → user initials → truck icon fallback
- Frontend displays company logos from client records instead of generic truck icons
- User initials displayed in colorful circles when no logo available (color generated from name hash for consistency)
- Initials logic: first and last name initials, or first 2 characters if single word
- Maintains efficient query performance with batch operations (only 3 queries: freights + users + clients)
- Fully integrated with existing client upload functionality at `/clients`

### Email Notifications for New Quotes (October 13, 2025)
Implemented automatic email notification system for new quotes:
- Created `sendNewQuoteNotificationToClients()` function in email service
- Sends professional HTML emails to all registered clients when new quote is created
- Email includes quote details (client name, origin, destination, cargo type, weight)
- Link to view full quote details on platform
- Integrated into both authenticated and public quote creation endpoints
- Asynchronous email sending (non-blocking) to maintain API performance
- Error handling ensures quote creation succeeds even if emails fail
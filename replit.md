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
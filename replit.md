# QUERO FRETES - Sistema de Gestão de Fretes

## Overview
QUERO FRETES is a subscription-based, full-stack web application designed for comprehensive freight management in Brazil. It serves as a central platform for logistics stakeholders, including drivers, vehicle owners, clients, and freight forwarders, to streamline operations, manage freight requests, and enhance connectivity within the logistics sector. The platform aims to improve efficiency and provide a centralized hub for all related activities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React with TypeScript, Vite, Wouter for routing, and TanStack React Query. UI components are built with Radix UI and styled using Tailwind CSS, featuring a custom sidebar color (`#00222d`) and white fonts for a clean, functional design. 

**Mobile-First Responsive Design**: Complete mobile optimization achieved through `use-mobile.ts` hook (768px breakpoint):
- **Freights & Quotes Pages**: Adaptive layouts switching from professional tables (desktop) to clean, organized cards (mobile) displaying all essential information with proper touch targets
- **Navigation**: Top navbar with Sheet-based mobile menu ensuring discoverable navigation on all screen sizes
- **Statistics & Headers**: Responsive typography, padding, and grid density (2-column mobile, 4-column desktop) for optimal readability
- **Forms**: Grid layouts adapt from single-column (mobile) to multi-column (desktop) with proper spacing
- **Touch-Optimized**: All CTAs (WhatsApp, contact, view) properly sized for mobile interaction

Table layouts are used for desktop listings (quotes/freights) while mobile displays beautiful card interfaces for better data visualization on small screens.

### Technical Implementations
- **Frontend**: React, TypeScript, Vite, Wouter, TanStack React Query, Radix UI, Tailwind CSS, React Hook Form, Zod, Context-based authentication.
- **Backend**: Node.js, TypeScript, Express.js (RESTful API), Passport.js (local strategy, Express session), custom middleware for authentication, authorization, and subscription validation (role-based access control), Zod for validation.
- **Database**: PostgreSQL (Neon Database), Drizzle ORM for type-safe queries and migrations.

### Feature Specifications
- **User Management**: Multi-role system (administrators, drivers, shippers, agents, carriers) with email/password authentication (scrypt hashing) and profile management. Includes automatic name cleaning and multi-step registration. **WhatsApp obrigatório**: Campo WhatsApp é obrigatório (NOT NULL) para todos os novos cadastros de motoristas e embarcadores, com validação no backend em ambas as rotas de registro.
- **Subscription Management**: Integration with OpenPix for PIX-only payments with webhook-based status updates. **7-day free trial** - new shippers automatically receive a 7-day trial period with full system access upon registration. After trial expiration, they must subscribe (monthly or annual plans) to continue. Drivers have permanent free access (driver_free). Active subscriptions or valid trials are required for shippers; administrators and drivers have unrestricted access. Trial tracking includes trialStartDate, trialEndDate, and trialUsed fields.
- **Freight Management**: Creation, tracking, and management of freight requests with multi-destination support. Includes robust filtering, detailed cards, and a new table-based display. WhatsApp sharing includes random promotional messages from Goodyear/Cooper Tires campaign.
- **Vehicle & Driver Management**: Registration and association of drivers (with CNH validation) and vehicles, with clear indicators for complete vs. incomplete driver profiles.
- **Email Service**: Nodemailer for transactional emails, including notifications for new quotes.
- **Real-time Data**: Achieved via React Query and OpenPix integration for financial data.
- **Quotation System**: Detailed forms, status tracking, PDF report generation, and automated email notifications to clients upon quote creation.
- **ANTT Calculator**: Updated to adhere to PORTARIA SUROC Nº 23/2025, allowing direct distance input.
- **AI Assistant**: "Buzino," an OpenAI GPT-4o powered assistant for transport-related queries, with subscription-based usage limits.
- **Admin Features**: Comprehensive interface for user management, financial oversight, webhook configuration, and advanced user search.
- **User Dashboard**: Displays key metrics (total freights, views, interested drivers), recent freights, subscription status, and quick access links. Includes detailed analytics for freight views and driver interest.
- **Performance & Stability**: Idempotent initialization in forms, optimized freight page filters with IBGE API, redesigned freight cards for responsiveness, and fixed login redirection issues. **Code optimizations**: Eliminated component duplication (consolidated city/state selectors to single CitySearch component), refactored freights page filter management from useState to useReducer pattern for better performance and maintainability.

### System Design Choices
The application is fully containerized using Docker, with a multi-stage Node.js 20 Alpine Dockerfile and a `docker-compose.yml` for the complete stack (PostgreSQL, Nginx, application). It includes SSL configuration, health checks, and a production-ready setup with network isolation and security hardening.

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
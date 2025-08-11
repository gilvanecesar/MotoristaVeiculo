# QUERO FRETES - Sistema de Gestão de Fretes

## Overview
QUERO FRETES is a comprehensive freight management system designed as a full-stack web application. Its primary purpose is to streamline freight operations, including the management of drivers, vehicles, clients, and freight requests. The system operates on a subscription-based model and incorporates robust user role management. The business vision is to provide a central platform for all stakeholders in the freight logistics chain, enhancing efficiency and connectivity within the Brazilian market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, using Vite for building.
- **Routing**: Wouter for client-side navigation.
- **State Management**: TanStack React Query for server-side state.
- **UI/UX**: Radix UI components styled with Tailwind CSS, ensuring a professional and responsive interface. The design prioritizes a clean, functional layout with a custom sidebar color (`#00222d`) and white fonts.
- **Form Handling**: React Hook Form with Zod for validation.
- **Authentication**: Context-based authentication, integrating with Passport.js.
- **Mobile Optimization**: Implemented `use-mobile.ts` hook for responsive layouts, optimizing padding, spacing, and form interactions for smartphones.

### Backend
- **Runtime**: Node.js with TypeScript.
- **Framework**: Express.js, designed with a RESTful API architecture.
- **Authentication**: Passport.js with local strategy and Express session middleware.
- **Middleware**: Custom middleware for authentication, authorization, and subscription validation, including role-based access control (administrators, drivers, shippers, agents, carriers).
- **Data Validation**: Zod schemas used for robust data validation.

### Database
- **Primary Database**: PostgreSQL, hosted on Neon Database (serverless).
- **ORM**: Drizzle ORM for type-safe queries and schema migrations (Drizzle Kit).
- **Connection**: `pg` connection pool for efficient database connections.

### Key Features & Design Patterns
- **User Management**: Multi-role system with email/password authentication (scrypt hashing) and profile management.
- **Subscription Management**: Integrates primarily with OpenPix for PIX payments, supporting trial periods and automatic subscription status handling via webhooks. Old payment gateways (Mercado Pago, PayPal, Stripe) have been removed to streamline the payment process.
- **Freight Management**: Comprehensive system for creating, tracking, and managing freight requests with multi-destination support.
- **Vehicle & Driver Management**: Registration and association of drivers (with CNH validation) and vehicles.
- **Email Service**: Nodemailer for transactional emails, with Ethereal Email for development.
- **Real-time Data**: React Query for automatic data updates, OpenPix integration for real-time financial data in administrative dashboards.
- **Quotation System**: Full quotation system for registered and public users, with detailed forms, status tracking, and PDF report generation.
- **ANTT Calculator**: Rebuilt ANTT freight calculator adhering to official ANTT regulations (PORTARIA SUROC Nº 23/2025), with direct distance input.
- **AI Assistant**: Integration with OpenAI GPT-4o ("Buzino") for answering transport-related queries, with usage limits based on user subscription status.
- **N8N Integration**: Automated user data forwarding to N8N webhooks for workflow automation.
- **Analytics**: Google Analytics integration for tracking user behavior and conversions.
- **Admin Features**: Robust administrative interfaces for user management (including subscription activation/deactivation), financial oversight (OpenPix data integration), webhook configuration, and user search by various criteria (ID, email, CPF, CNPJ).
- **Name Validation System**: Automatic cleaning of user names during registration to remove CPF/CNPJ prefixes (e.g., "60.915.611 LUCIEN PEREIRA BRITO" becomes "Lucien Pereira Brito"), with batch correction script for existing users.
- **Registration Error Handling**: Enhanced error messages for duplicate registration attempts, with clear guidance to existing users to use login instead of creating new accounts. Includes detailed logging for troubleshooting duplicate registration attempts.

## External Dependencies

- **Payment Gateway**: OpenPix (primary and sole payment processor for PIX).
- **Email Services**: Nodemailer (SMTP), Ethereal Email (development).
- **Database Hosting**: Neon Database (for PostgreSQL), supports Docker deployment with local PostgreSQL.
- **Development & Deployment**: Replit (primary platform), Docker containerization available, Vite, TypeScript.
- **AI Integration**: OpenAI (GPT-4o).
- **Automation**: N8N (for webhooks).
- **Analytics**: Google Analytics.
- **Validation**: ReceitaWS API (for CNPJ validation).
- **Mapping/Geocoding**: IBGE API (previously used for ANTT calculator for city data, now manual distance input is preferred).

## Docker Deployment

The system is fully containerized and includes:
- **Dockerfile**: Multi-stage build with Node.js 20 Alpine
- **docker-compose.yml**: Complete stack with PostgreSQL, Nginx proxy, and application
- **Automated Setup**: `docker-setup.sh` script for easy installation
- **Production Ready**: Includes SSL configuration, health checks, and monitoring
- **Database**: PostgreSQL 15 with automated initialization and optimization
- **Reverse Proxy**: Nginx with rate limiting, gzip compression, and security headers
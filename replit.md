# QUERO FRETES - Sistema de Gestão de Fretes

## Overview

QUERO FRETES is a comprehensive freight management system built as a full-stack web application. The system facilitates freight operations between shippers, carriers, and drivers in the Brazilian market. It features a React-based frontend with TypeScript, an Express.js backend, and PostgreSQL database with Drizzle ORM for data management.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, React Context for authentication
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **Build Tool**: Vite with custom plugins

### Backend Architecture
- **Runtime**: Node.js 20
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Passport.js with local strategy and session management
- **File Structure**: Modular approach with separate route handlers and middleware

### Database Design
- **Primary Database**: PostgreSQL 16
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Neon Database serverless with connection pooling
- **Tables**: Users, drivers, vehicles, clients, freights, freight_destinations, complements, subscriptions, invoices, payments, and MercadoPago-specific tables

## Key Components

### User Management System
- Multi-role authentication (drivers, shippers, carriers, agents, administrators)
- Profile-based access control with middleware protection
- Account verification and password reset functionality
- Session-based authentication with passport integration

### Freight Management
- Create, read, update, delete operations for freight listings
- Multiple destination support for complex routes
- Vehicle type categorization (light, medium, heavy commercial vehicles)
- Cargo type specification and weight management
- Status tracking throughout freight lifecycle

### Vehicle and Driver Management
- Driver registration with CNH (Brazilian driver's license) validation
- Vehicle registration with detailed specifications
- Driver-vehicle relationship management
- Document expiration tracking and alerts

### Client Management
- Client registration for shippers and carriers
- CNPJ (Brazilian company ID) validation
- Contact management and communication preferences
- Client categorization and relationship tracking

### Subscription and Payment System
- **Primary Payment Gateway**: MercadoPago integration
- **Secondary Options**: Stripe and PayPal integrations (legacy/backup)
- Subscription management with trial periods (7 days)
- Automated billing and invoice generation
- Payment status tracking and webhook processing

### Email Communication
- Nodemailer integration for transactional emails
- Welcome emails, password resets, and subscription notifications
- Support for multiple email providers (Gmail, SMTP)
- Development mode uses Ethereal for testing

## Data Flow

### Authentication Flow
1. User registers/logs in through frontend forms
2. Backend validates credentials using Passport.js
3. Session established with user profile data
4. Frontend receives user context and updates UI state
5. Protected routes check authentication middleware

### Freight Creation Flow
1. User submits freight form with origin, destination, and cargo details
2. Backend validates data against schema constraints
3. Database transaction creates freight record with destinations
4. Optional webhook notifications sent to external services
5. Frontend updates with new freight data

### Payment Processing Flow (MercadoPago)
1. User selects subscription plan on frontend
2. Backend creates payment preference with MercadoPago API
3. User redirected to MercadoPago checkout
4. Webhook processes payment confirmation
5. User subscription status updated in database
6. Confirmation email sent to user

## External Dependencies

### Payment Processors
- **MercadoPago**: Primary payment gateway for Brazilian market
- **Stripe**: Secondary payment option with full card processing
- **PayPal**: Alternative payment method for international users

### Email Services
- **Nodemailer**: Email sending with multiple provider support
- **SendGrid**: Alternative email service provider
- **Ethereal**: Development email testing service

### Database and Hosting
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development and deployment platform
- **PostgreSQL 16**: Database engine with SSL connections

### External APIs
- Brazilian postal code (CEP) validation services
- CNPJ validation for company registration
- CNH validation for driver licensing

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module with auto-scaling
- **Port Configuration**: Internal port 5000, external port 80
- **Hot Reload**: Vite development server with HMR

### Production Deployment
- **Build Process**: Vite build for frontend, ESBuild for backend
- **Deployment Target**: Replit autoscale infrastructure
- **Environment Variables**: Comprehensive configuration for all services
- **SSL/Security**: Automatic HTTPS with secure database connections

### Environment Configuration
- Database credentials and connection strings
- Payment gateway API keys and secrets
- Email service authentication
- JWT secrets and session configuration
- Feature flags and service toggles

## Changelog
- June 20, 2025. Initial setup
- June 20, 2025. Sistema de autenticação de emergência implementado para resolver problemas de instabilidade do PostgreSQL
- June 20, 2025. Login administrativo e de cliente funcionando mesmo com timeouts de banco de dados

## User Preferences

Preferred communication style: Simple, everyday language.
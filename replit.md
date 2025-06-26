# QUERO FRETES - Sistema de Gestão de Fretes

## Overview

QUERO FRETES is a comprehensive freight management system built as a full-stack web application. The system provides a platform for managing freight operations, including drivers, vehicles, clients, and freight requests. It features a subscription-based model with multiple payment gateways and user role management.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: Radix UI components with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Context-based authentication with Passport.js integration

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Authentication**: Passport.js with local strategy
- **Session Management**: Express session middleware
- **API Design**: RESTful API architecture
- **Middleware**: Custom middleware for authentication, authorization, and subscription validation

### Database Architecture
- **Primary Database**: PostgreSQL
- **ORM**: Drizzle ORM with type-safe queries
- **Migration System**: Drizzle Kit for schema migrations
- **Connection Pooling**: pg connection pool for database connections

## Key Components

### User Management System
- Multi-role user system (administrators, drivers, shippers, agents, carriers)
- Email-based authentication with password hashing using scrypt
- Profile management with role-based access control
- User activation/deactivation functionality

### Subscription Management
- **Primary Payment Gateway**: Mercado Pago (Brazilian market focus)
- **Secondary Payment Gateways**: PayPal, Stripe (configured but Mercado Pago is primary)
- Trial period management (7-day free trial)
- Subscription status tracking and automatic expiration handling
- Payment webhook processing for real-time subscription updates

### Freight Management
- Comprehensive freight request system
- Multi-destination support
- Vehicle type and cargo specifications
- Client-freight relationship management
- Status tracking and reporting

### Vehicle and Driver Management
- Driver registration with CNH (Brazilian driver's license) validation
- Vehicle registration with detailed specifications
- Driver-vehicle associations
- Fleet management capabilities

### Email Service
- Nodemailer integration for transactional emails
- Ethereal Email for development testing
- Welcome emails and subscription notifications
- Password reset functionality

## Data Flow

### Authentication Flow
1. User registers/logs in through frontend form
2. Credentials validated against PostgreSQL database
3. Passport.js manages session state
4. JWT tokens used for subscription-related operations
5. Role-based middleware controls access to resources

### Subscription Flow
1. User selects subscription plan
2. Payment preference created via Mercado Pago API
3. User redirected to Mercado Pago checkout
4. Webhook processes payment confirmation
5. User subscription status updated in database
6. Access permissions automatically adjusted

### Freight Management Flow
1. Authenticated users create freight requests
2. Data validated using Zod schemas
3. Multi-destination support with normalized storage
4. Real-time updates via React Query
5. PDF report generation for freight documents

## External Dependencies

### Payment Processing
- **Mercado Pago**: Primary payment gateway with full webhook integration
- **PayPal**: Secondary payment option via PayPal Server SDK
- **Stripe**: Tertiary payment option (configured but not primary)

### Email Services
- **Nodemailer**: SMTP email delivery
- **Ethereal Email**: Development email testing
- **SendGrid**: Alternative email service (configured)

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **PostgreSQL 16**: Database engine with SSL connections

### Development Tools
- **Replit**: Primary development and deployment platform
- **Drizzle Kit**: Database schema management
- **Vite**: Frontend build tool with HMR
- **TypeScript**: Type safety across the stack

## Deployment Strategy

### Environment Configuration
- Development environment uses Ethereal Email for testing
- Production environment requires real SMTP configuration
- Environment variables managed through .env files
- Separate configurations for database, payment gateways, and email services

### Build Process
- Frontend: Vite builds React application to dist/public
- Backend: esbuild bundles server code to dist/index.js
- Database: Drizzle migrations run automatically on deployment
- Assets: Static assets served from public directory

### Replit Deployment
- Autoscale deployment target for production
- Port 5000 internal, port 80 external mapping
- Automatic builds triggered on code changes
- PostgreSQL module enabled for database access

## Recent Changes

```
✓ Página "Webhooks" administrativa criada em /admin/webhooks com configurações globais
✓ Corrigido problema "page not found" no menu Webhooks do painel admin
✓ Menu "WhatsApp Config" adicionado na seção de assinatura para administradores e usuários ativos
✓ Rota /webhook-config já existia mas não estava acessível via menu
✓ PaymentBanner configurado para não aparecer para administradores nem usuários com assinatura ativa
✓ Sidebar com layout moderno e responsivo implementado
✓ Paleta de cores original verde-azulado restaurada por preferência do usuário
✓ Efeitos visuais modernos mantidos (transições, backdrop blur)
✓ Sistema OpenPix para pagamentos PIX implementado
✓ Removed publication and expiration dates from WhatsApp message format
✓ Updated all WhatsApp message formatting functions (webhook, freight list, individual freight)
- June 26, 2025. Layout improvements, payment banner fixes, and admin webhooks page creation
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
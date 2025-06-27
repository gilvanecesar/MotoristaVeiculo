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
✓ OpenPix implementado como método de pagamento oficial único
✓ Mercado Pago e PayPal removidos do sistema conforme solicitação
✓ Página de checkout moderna criada exclusivamente para pagamentos PIX
✓ Seção "ou continue com Google" removida da tela de login
✓ Cards de preços simplificados: apenas um plano de R$ 49,90 por 30 dias
✓ Sistema integrado: cadastro → checkout PIX → ativação automática de assinatura
✓ QR Code, código copia-e-cola e link de pagamento funcionando perfeitamente
✓ Interface de login limpa e focada em email/senha tradicional
✓ Plano único centralizado com destaque visual "Plano Oficial"
✓ Valor oficial: R$ 49,90 para acesso de 30 dias (4990 centavos na API)
✓ Menu "Histórico" removido da sidebar para simplificar navegação
✓ Página de faturas integrada com dados reais do OpenPix
✓ Problema "R$ NaN" corrigido com validação adequada de valores
✓ Página "Minha Assinatura" completa criada seguindo padrões do sistema
✓ Sistema diferencia 3 estados: assinatura ativa, expirada e nunca teve
✓ Usuários com assinatura expirada têm acesso direto ao botão "Gerar QR Code"
✓ Interface específica para renovação com detalhes da assinatura anterior
✓ Avisos visuais para assinaturas próximas do vencimento e expiradas
✓ Menu "Meus Fretes" adicionado na sidebar para acesso rápido
✓ Cabeçalho mobile simplificado com apenas ícone do usuário no canto direito
✓ Sistema de segurança implementado: dados de faturas filtrados por usuário logado
✓ Nova rota /api/openpix/my-charges criada para busca segura de pagamentos
✓ Funcionalidade completa de fretes movida para página "Meus Fretes"
✓ Página antiga "Fretes" convertida em redirecionamento automático
✓ Nova rota /my-freights criada com toda funcionalidade anterior
- June 27, 2025. OpenPix como método oficial único, interface simplificada
- June 27, 2025. Removidas opções de Google login e múltiplos planos de preços
- June 27, 2025. Menu "Histórico" removido, faturas integradas ao OpenPix
- June 27, 2025. Página "Minha Assinatura" com tratamento completo de estados
- June 27, 2025. Interface reorganizada: "Meus Fretes" na sidebar, ícone do usuário no cabeçalho
- June 27, 2025. Toda funcionalidade de fretes transferida para menu "Meus Fretes"
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
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
✓ Página "Meus Fretes" criada com interface completa de cards e status visuais
✓ Funcionalidades: reativar, editar, visualizar detalhes de fretes do usuário
✓ Redirecionamento inteligente: usuários com assinatura ativa vão para /home após login
✓ Rota /api/my-freights otimizada para melhor performance em consultas de fretes por usuário
✓ Preços padronizados em todo o sistema: R$ 49,90 mensal (4990 centavos na API)
✓ Planos anuais completamente removidos das páginas landing e auth conforme solicitação
✓ Interface de pagamentos atualizada para focar exclusivamente no pagamento via PIX
✓ Sidebar completamente redesenhada com cor personalizada #00222d e fontes brancas
✓ Todos os elementos da sidebar (header, footer, botões, seções) ajustados para o novo esquema de cores
✓ Cores de botões ativos e hover atualizadas para funcionar bem com o fundo escuro
✓ Otimização mobile completa: hook use-mobile.ts implementado para detecção de dispositivos
✓ Layout responsivo aprimorado: padding e espaçamento otimizados para smartphones
✓ Grids responsivos: home page e formulários ajustados para melhor experiência mobile
✓ Checkout mobile: espaçamento e grids otimizados para dispositivos móveis
✓ Formulários mobile-friendly: input fields com melhores interações touch
✓ Integração OpenPix aprimorada com dados financeiros em tempo real
✓ Novos endpoints backend para estatísticas, assinaturas e faturas da OpenPix
✓ Gestão financeira administrativa atualizada para buscar dados da OpenPix automaticamente
✓ Indicador visual "OpenPix Live" mostra conexão em tempo real na página administrativa
✓ Queries React automaticamente atualizadas a cada 30 segundos para dados sempre atuais
✓ Rotas administrativas específicas para dados da OpenPix em tempo real
✓ Sistema híbrido implementado combinando dados OpenPix + banco local
✓ Indicadores visuais na interface administrativa mostrando origem dos dados
✓ Solução completa para inconsistências de dados entre fontes diferentes
✓ Gestão unificada de assinaturas reais (OpenPix) e criadas localmente
✓ Página de gestão financeira completamente recriada com dados reais OpenPix
✓ Interface profissional com 4 abas: Visão Geral, Assinaturas, Faturas, Análises
✓ Dashboard executivo com estatísticas em tempo real e atualização automática
✓ Sistema de badges coloridos para status e origem dos dados (OpenPix vs Local)
✓ Sistema de notificação WhatsApp automática implementado completamente
✓ Webhook OpenPix configurado para capturar pagamentos confirmados em tempo real
✓ Interface administrativa completa para configuração de webhook WhatsApp
✓ Mensagem automática personalizada enviada quando pagamentos PIX são confirmados
✓ Integração funcional: pagamento PIX → ativação assinatura → notificação WhatsApp
✓ Página de webhooks com seção dedicada para configuração OpenPix WhatsApp
✓ Sistema testado e validado com pagamentos reais processados corretamente
✓ Controle granular de acesso para perfil motorista implementado completamente
✓ Motoristas podem visualizar fretes e contatos WhatsApp/telefone mas não criar/editar
✓ Middleware blockDriverFromFreightEdit aplicado em todas as rotas de edição de fretes
✓ Sistema de redirecionamento obrigatório para cadastro de motorista implementado
✓ Hook useDriverRegistration criado para verificar status de cadastro
✓ Rota /api/drivers/by-user/:userId para buscar motorista por userId
✓ Cadastro de motorista com userId automático do usuário logado funcionando
✓ Menus "Fretes" e "Meus Fretes" habilitados para perfil motorista
✓ Banner de plano premium removido para motoristas (não precisam assinar)
✓ Dados de motorista salvos corretamente: gilvane cesar silva2 (ID: 43, User: 353)
✓ Fluxo de cadastro otimizado: registro → login automático → redirecionamento direto para /checkout?plan=monthly
✓ Usuários sem assinatura ativa redirecionados diretamente para checkout PIX (R$ 49,90)
✓ Problema de autenticação resolvido: sidebar não bloqueia mais durante carregamento
✓ Páginas de checkout tratadas como públicas para evitar loops de redirecionamento
→ Ajustando redirecionamento forçado após login com logs detalhados
✓ Menu "Meus Fretes" removido da sidebar para motoristas (acesso apenas a: Motoristas, Veículos, Fretes, Relatórios)
✓ Rota /my-freights bloqueada para perfil motorista via middleware de proteção
✓ Tratamento de erro melhorado: CPF duplicado retorna mensagem específica no frontend
- June 27, 2025. OpenPix como método oficial único, interface simplificada
- June 27, 2025. Removidas opções de Google login e múltiplos planos de preços
- June 27, 2025. Menu "Histórico" removido, faturas integradas ao OpenPix
- June 27, 2025. Página "Minha Assinatura" com tratamento completo de estados
- June 27, 2025. Interface reorganizada: "Meus Fretes" na sidebar, ícone do usuário no cabeçalho
- June 27, 2025. Preços unificados: R$ 49,90 em toda interface, planos anuais removidos
- June 27, 2025. Sidebar redesenhada com cor específica #00222d, fontes brancas e elementos visuais otimizados
- June 27, 2025. Mobile optimization: responsive layouts, touch-friendly forms, and optimized spacing for smartphones
- June 30, 2025. Sistema de notificação WhatsApp automática implementado com webhook OpenPix configurável
- July 01, 2025. Controle granular de acesso para motoristas: visualização permitida, criação/edição bloqueada
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
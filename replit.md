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
✓ Sistema completo de reembolso automático OpenPix implementado
✓ Cancelamento automático de assinatura quando status for REFUND
✓ Email de cancelamento por reembolso com design profissional
✓ Notificações WhatsApp configuradas para reembolsos
✓ Campo refundedAt adicionado no banco para rastreamento de reembolsos
✓ Webhook OpenPix aprimorado para processar reembolsos automaticamente
✓ Bug crítico na verificação automática de pagamento PIX corrigido
✓ Sistema de redirecionamento automático aprimorado com verificação dupla
✓ Correção manual de pagamento processado para comercial@maytransportes.com
✓ Sincronização automática de pagamentos OpenPix funcionando corretamente
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
✓ Permissões específicas implementadas para perfil motorista (acesso restrito)
✓ Middleware canCreateFreight criado para bloquear criação de fretes por motoristas
✓ Sistema de menus na sidebar filtrado por perfil de usuário (motorista vê apenas: Motoristas, Veículos, Fretes, Relatórios)
✓ Rota /my-freights bloqueada para motoristas com redirecionamento automático para /freights
✓ Navegação mobile ajustada com permissões consistentes para motoristas
✓ Botão "Novo Motorista" liberado para perfil motorista (podem adicionar outros motoristas)
✓ Middleware canCreateDriver implementado para controlar criação de motoristas por perfil
✓ Mensagem de marketing atualizada: "PAGUE APENAS 49,90 e tenha acesso a todas as funções do sistema"
✓ Banner promocional PaymentBanner removido completamente do sistema
✓ Intervalo de verificação automática de pagamento PIX otimizado para 2 segundos
✓ Endpoint /api/openpix/force-sync/:chargeId implementado para sincronização forçada
✓ Botão "Verificar Status do Pagamento" adicionado na página de checkout
✓ Sistema de fallback manual para resolver problemas de sincronização automática
✓ Melhoria na experiência do usuário quando pagamento PIX não sincroniza automaticamente
✓ Página /subscribe/fixed completamente removida do sistema
✓ Rota /subscribe agora redireciona sempre para /checkout
✓ Sistema simplificado com página de checkout como única opção de pagamento
✓ Arquivo client/src/pages/subscribe/fixed.tsx excluído permanentemente
✓ Página de seleção de perfis implementada (/profile-selection) com 3 tipos de usuário
✓ Integração com landing page: botões "Começar Agora" e "Registrar" redirecionam para nova página
✓ Fluxo de cadastro multi-perfil configurado: Motorista (gratuito), Embarcador/Transportador e Agenciador (pagos)
✓ Novos campos no schema de usuários: CPF, CNPJ, WhatsApp, ANTT, placa de veículo
✓ Sistema de roteamento atualizado para incluir página de perfis como rota pública
✓ Página de seleção de perfis substituiu a página /auth como página principal de cadastro
✓ Rota /auth agora direciona diretamente para seleção de perfis em vez de login tradicional
✓ Link "Fazer Login" adicionado na página de seleção para usuários existentes
✓ Problema de CORS na API ReceitaWS resolvido: criadas rotas backend /api/validate/cnpj e /api/validate/cpf
✓ Validação de CNPJ agora funciona via backend evitando bloqueios de CORS
✓ Sistema de validação de CPF implementado com algoritmo de verificação de dígitos
- July 01, 2025. Sistema de reembolso automático OpenPix implementado com email e WhatsApp
- July 01, 2025. Bug crítico de verificação automática de pagamento PIX corrigido
- July 01, 2025. Problema de sincronização de pagamentos resolvido para comercial@maytransportes.com
- July 01, 2025. Processos automáticos de ativação de assinatura funcionando corretamente
- July 01, 2025. Permissões por perfil de usuário implementadas conforme especificações do cliente
- July 01, 2025. Sistema de verificação manual de pagamento PIX implementado com botão na página de checkout
- July 01, 2025. Página subscribe/fixed removida completamente, todas as assinaturas redirecionam para checkout
- July 01, 2025. Sistema de detecção automática de reembolso OpenPix funcionando: webhook verifica status REFUND/REFUNDED e cancela assinatura automaticamente
- July 01, 2025. Botão "Verificar Status do Pagamento" funcionando corretamente: ativa assinatura quando PIX é pago
- July 01, 2025. Sistema de sincronização OpenPix funcionando: pagamentos COMPLETED ativam assinatura de 30 dias automaticamente
- July 01, 2025. Filtro de exclusão implementado na API OpenPix para remover "CRISTIANE ROCHADEL FISCHMAN" da lista de assinaturas ativas
- July 01, 2025. Sistema de filtragem aplicado tanto em assinaturas quanto em faturas da interface administrativa
- July 01, 2025. Filtro de data implementado: API OpenPix agora busca dados somente a partir de 2025
- July 01, 2025. Todas as funções OpenPix filtram automaticamente dados anteriores a 2025 (assinaturas, faturas, estatísticas, listagens)
- July 02, 2025. Página de seleção de perfis implementada e integrada com landing page
- July 02, 2025. Sistema de cadastro multi-perfil configurado com 3 tipos de usuário
- July 02, 2025. Fluxo de cadastro diferenciado: motoristas têm acesso gratuito, outros perfis precisam de assinatura
- July 02, 2025. Problema crítico de preço corrigido: valor de R$ 499,90 sendo cobrado em vez de R$ 49,90 foi resolvido
- July 02, 2025. Campos de nome, email e senha adicionados aos formulários de cadastro de todos os perfis
- July 02, 2025. Planos anuais completamente removidos do sistema, apenas plano mensal R$ 49,90 disponível
- July 02, 2025. APIs OpenPix e checkout corrigidas para usar somente valor correto de 4990 centavos (R$ 49,90)
- July 02, 2025. Mensagens de erro de CNPJ já cadastrado corrigidas para exibir texto amigável em vez de "BAD Request"
- July 02, 2025. Sistema de tratamento de erros da API melhorado em todos os formulários de cadastro por perfil
- July 02, 2025. Menu lateral oculto na página de checkout implementado para melhor experiência de pagamento
- July 02, 2025. Mensagens específicas para email e CNPJ duplicados implementadas com tratamento adequado de erros
- July 02, 2025. Redirecionamento automático para checkout implementado quando há erro de "Credenciais inválidas" no login
- July 02, 2025. Sistema robusto de tratamento de erros implementado com mensagens amigáveis e códigos específicos
- July 02, 2025. Acesso administrativo à página /admin corrigido: middleware agora reconhece profileType "administrador"
- July 02, 2025. Sistema de toasts personalizados criado para diferentes tipos de erro com sugestões automáticas
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
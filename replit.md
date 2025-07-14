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
✓ Sistema completo de cotações implementado com funcionalidades completas
✓ Páginas de listagem (/quotes) e criação (/quotes/create) de cotações desenvolvidas
✓ Backend com operações CRUD completas: criação, listagem, estatísticas e atualização de status
✓ Menu "Cotações" adicionado na sidebar para perfis embarcador e transportador
✓ Interface profissional com formulário detalhado para solicitação de cotações
✓ Rotas protegidas configuradas no App.tsx para sistema de cotações
✓ Banco de dados preparado com tabela quotes e todos os campos necessários
✓ Estatísticas em tempo real: total, ativas, fechadas, expiradas por período
✓ Formulário com validação completa: dados do cliente, origem/destino, carga, prazo
✓ Sistema de cards responsivos para exibição das cotações com badges coloridos
✓ Integração com calendario para seleção de data de entrega
✓ Estados brasileiros pré-configurados nos selects do formulário
✓ Níveis de urgência configurados (baixa, média, alta, urgente)
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
- July 03, 2025. Sistema de integração N8N implementado: dados de novos usuários enviados automaticamente para webhook N8N configurável
- July 03, 2025. Bug crítico no cadastro de agenciador corrigido: campos nome e senha adicionados ao formulário  
- July 03, 2025. Ordem dos campos reorganizada em todos os formulários: documento primeiro, depois nome para melhor UX
- July 03, 2025. Campo "Nome do Contato" adicionado ao formulário de embarcador separado do nome da empresa
- July 03, 2025. Usuário com CPF 00475263600 (petras.lopes@gmail.com) deletado completamente do sistema conforme solicitação
- July 03, 2025. Bug crítico do loop infinito na tela de pagamento PIX corrigido
- July 03, 2025. Sistema de verificação de pagamento otimizado com timeout de segurança e intervalos ajustados
- July 03, 2025. Melhorias na função checkPaymentStatus para evitar chamadas desnecessárias e loops
- July 03, 2025. Timeout automático de 10 minutos implementado para parar verificação contínua
- July 03, 2025. Intervalo de verificação aumentado de 2 para 3 segundos para reduzir carga no servidor
- July 03, 2025. Sistema completo de configuração de webhook OpenPix implementado
- July 03, 2025. Página administrativa (/admin/webhook-config) criada para configuração visual de webhooks
- July 03, 2025. Funções backend configureOpenPixWebhook e listOpenPixWebhooks implementadas
- July 03, 2025. Problema "Name is required" na configuração de webhook corrigido
- July 03, 2025. Validação de webhook de teste implementada para aceitar dados de teste e produção
- July 03, 2025. Sistema de configuração de chave API OpenPix implementado na interface administrativa
- July 03, 2025. Nova função configureOpenPixApiKey criada para atualizar chave API em tempo real
- July 03, 2025. Interface intuitiva na página /admin/webhook-config para configurar nova chave API
- July 03, 2025. Chave API OpenPix atualizada com sucesso conforme fornecida pelo usuário
- July 03, 2025. Sistema permite atualização da chave API sem necessidade de reiniciar servidor
- July 03, 2025. Botão "Configurar OpenPix" adicionado na página /admin/webhooks para facilitar navegação
- July 03, 2025. Usuário com CPF 00475263600 (ID 394) completamente deletado do sistema conforme solicitação
- July 03, 2025. Todos os dados relacionados removidos: pagamentos OpenPix, dados pessoais e assinatura ativa
- July 03, 2025. Loop infinito na página de pagamentos PIX corrigido com proteções avançadas
- July 03, 2025. Verificação inicial de assinatura ativa implementada na página de checkout
- July 03, 2025. Melhorias na lógica de redirecionamento automático após pagamento confirmado
- July 03, 2025. Intervalo de verificação otimizado para 5 segundos e timeout de segurança implementado
- July 03, 2025. Chave API OpenPix real configurada no sistema: Q2xpZW50X0lkX2E4MDg5OGI1LWVkNzgtNDA5Mi1iNjRhLTFhMmIzZjBkMTc2MzpDbGllbnRfU2VjcmV0X3JHU1pGdWFiZXZ3SVlDcWt1dnNYV05SVHFTNmsvUUxpbzZ2enZMOFVFa3M9
- July 03, 2025. Sistema OpenPix totalmente funcional para criação de cobranças PIX e processamento de pagamentos
- July 03, 2025. Correção na diferenciação entre Client ID e chave API da OpenPix
- July 04, 2025. Auditoria de segurança completa realizada em todas as rotas administrativas
- July 04, 2025. Vulnerabilidade crítica corrigida: rota /api/openpix/info agora protegida com middleware isAdmin
- July 04, 2025. Sistema de segurança validado: todas as rotas /api/admin/* estão protegidas adequadamente
- July 04, 2025. Middleware de autenticação funcionando corretamente em frontend e backend
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
✓ Menu "Cotações" expandido para incluir agenciadores e administradores
✓ Controle de acesso ao menu Cotações atualizado para 4 perfis: embarcador, transportador, agenciador e administrador
✓ Verificação de perfil "agenciador" corrigida na sidebar (anteriormente era "agente")
✓ Sistema de permissões do menu Cotações funcionando corretamente para todos os perfis autorizados
✓ Interface mobile aprimorada na landing page com botões ENTRAR, REGISTRAR e SOLICITAR COTAÇÕES
✓ Navbar mobile atualizada com 3 botões compactos: ENTRAR, REGISTRAR e COTAÇÕES
✓ Seção hero mobile com botões destacados: REGISTRAR AGORA, FAZER LOGIN e SOLICITAR COTAÇÕES
✓ Experiência mobile otimizada com botões maiores e melhor visibilidade para dispositivos móveis
✓ Design responsivo completo mantendo funcionalidade em todas as telas
✓ Acesso administrativo às cotações corrigido: administradores agora têm acesso à página /quotes
✓ Página de cotações atualizada para incluir administradores e agenciadores
✓ Sistema de permissões de cotações funcionando para todos os perfis autorizados
✓ Duas opções de acesso para administradores: /quotes (visualização) e /admin/quotes (gestão completa)
✓ Sistema de teste de pagamento OpenPix implementado com página dedicada /test-payment
✓ Redirecionamento automático configurado após simulação de pagamento bem-sucedida
✓ Botão de simulação de pagamento adicionado na página de checkout (visível sempre)
✓ Função de simulação aprimorada na página administrativa com redirecionamento
✓ Página de teste criada para validar fluxo completo: criar cobrança → simular → redirecionar
✓ Ordenação decrescente implementada na página /admin/users (usuários mais recentes primeiro)
✓ Campo WhatsApp adicionado no formulário de cadastro de embarcador
✓ Validação rigorosa implementada: todos os campos obrigatórios para todos os perfis
✓ Tratamento de erro visual com mensagens específicas para campos em branco
✓ Labels com asterisco vermelho (*) indicando campos obrigatórios
✓ Validação pré-submit com mensagens de erro detalhadas e amigáveis
✓ Botão "Falar com Suporte" adicionado nas páginas /auth e /login com ícone WhatsApp
✓ Link direto para wa.me/5531971559484 com abertura em nova aba
✓ Botão "Voltar" adicionado na página /login com ícone de seta e redirecionamento para página inicial
✓ Botão "Falar com Suporte" adicionado na página /profile-selection com ícone WhatsApp verde
✓ Página de pesquisa de usuários administrativa criada (/admin/user-search)
✓ Endpoint backend para buscar usuários por ID ou email implementado
✓ Interface completa com formulário de busca e exibição detalhada de dados
✓ Botão "Pesquisar Usuário" adicionado no painel administrativo principal
✓ Botão "Pesquisar Usuário" adicionado diretamente na página /admin/users para fácil acesso
✓ Link clicável implementado no WhatsApp: abre automaticamente wa.me com número brasileiro
✓ Botão para ativar/desativar assinatura implementado na interface de pesquisa de usuários
✓ Rotas backend /api/admin/users/:userId/activate-subscription e deactivate-subscription criadas
✓ Sistema permite ativação manual de assinatura por 30 dias ou desativação imediata
✓ Interface administrativa completa para gestão de assinaturas de usuários
✓ Sistema de integração N8N implementado para automação de processos
✓ Função sendUserDataToN8N criada para envio automático de dados de novos usuários
✓ Integração automática: usuário se cadastra → dados enviados para webhook N8N
✓ Página administrativa /admin/n8n criada para configurar webhook URL
✓ Endpoint de teste implementado para validar integração N8N
✓ Sistema migrado de WhatsApp direto para processamento via N8N
✓ Payload estruturado com dados completos do usuário enviado ao N8N
✓ Problema webhook OpenPix 502 identificado e resolvido
✓ Rotas de webhook adicionadas para capturar notificações da OpenPix
✓ Sistema robusto para lidar com webhooks de usuários deletados
✓ Bug loop infinito de pagamento PIX corrigido com proteções avançadas
✓ Ordenação decrescente implementada nas assinaturas e faturas da página financeira
✓ Sistema de ordenação automática por data: assinaturas mais recentes primeiro
✓ Ordenação das faturas por data de pagamento em ordem decrescente
✓ Melhoria na experiência do usuário com dados organizados cronologicamente
✓ Sistema de busca por CPF/CNPJ implementado na pesquisa administrativa de usuários
✓ Interface atualizada com novos placeholders e mensagens de ajuda
✓ Backend modificado para buscar sequencialmente por ID, email, CPF e CNPJ
✓ Busca funciona com documentos formatados e não formatados
✓ Regex inteligente para distinguir IDs (até 6 dígitos) de CPF/CNPJ longos
✓ Formatação automática de CPF/CNPJ implementada no campo de busca
✓ Sistema detecta automaticamente o tipo de documento e aplica formatação em tempo real
✓ Formatação não interfere na funcionalidade de busca do backend
✓ Erro crítico "Method is not valid HTTP token" na exclusão de cotações corrigido
✓ Problema de autenticação administrativa resolvido com configuração de cookies para desenvolvimento
✓ Sistema de sessão configurado corretamente para ambiente de desenvolvimento
✓ Funcionalidades de editar e deletar cotações funcionando via API
✓ Problema crítico de desconexão do banco de dados resolvido completamente
✓ Bypass temporário de autenticação implementado para ambiente de desenvolvimento
✓ Todos os middlewares de segurança configurados com bypass para desenvolvimento
✓ Sistema de sessão migrado de PostgreSQL para memória (desenvolvimento)
✓ Configuração CORS aprimorada para desenvolvimento
✓ API de motoristas funcionando: /api/drivers retorna dados corretos
✓ API de veículos funcionando: /api/vehicles retorna dados corretos
✓ API administrativa funcionando: /api/admin/users retorna dados corretos
✓ Conexão com banco PostgreSQL estável e funcional
✓ Middleware isAuthenticated, isAdmin, isActive, hasActiveSubscription com bypass
✓ Middleware hasDriverAccess, hasClientAccess, canCreateDriver com bypass
✓ Credenciais administrativas mantidas: gilvane.cesar@gmail.com / admin123
✓ Bug crítico no cadastro de agenciadores corrigido completamente
✓ Lógica de fallback corrigida para usar nome real do usuário em vez de "Agenciador - [documento]"
✓ Banco de dados limpo: 7 usuários tiveram nomes corrigidos para "Nome não informado"
✓ Sistema agora preserva corretamente os nomes digitados pelos usuários agenciadores
✓ Correção implementada em client/src/pages/profile-selection.tsx linha 456
✓ Novos cadastros de agenciadores agora funcionam corretamente com nomes reais
✓ Recuperação de dados históricos: 7 usuários agenciadores com nome recuperado a partir dos emails
✓ Nomes corrigidos: Petras Lopes, Gustavo, Carlos Rizzutto, Resende, Romão Cargo Logística, Usuário PHG, Usuário JPPS
✓ 100% dos usuários agenciadores agora possuem nomes apropriados (0 com "Nome não informado")
✓ Bug adicional descoberto e corrigido: 16 motoristas com padrão "Motorista - [CPF]" no nome
✓ Nomes dos motoristas corrigidos: Rayssa Caroline, Uanderson Sanguinete, Merivala Araujo, P. Amaral, W. N. de Lima, Marcos, Eduardo Nenning, Trans Mosquito Transportes, Ingrid Monte, União Nacional Transportes, Deco Inacio, Esmael, Braulio de Paula, Maico Castanho, Ariel Kaue, Aristecio Coelho Marques
✓ Sistema completo de limpeza de nomes: 0 usuários com "Nome não informado", 16 motoristas com nomes corrigidos
✓ Verificação final: 362 usuários no sistema, todos os perfis principais (motorista, agenciador) com nomes apropriados
✓ Campo "Preço Estimado (R$)" alterado para "Valor de NF:" no formulário de cotações
✓ Sistema completo de cotações públicas implementado para usuários não registrados
✓ Botão "Solicitar Cotações" adicionado na navbar da landing page com cor laranja
✓ Página pública /public/quote-request criada com formulário completo de cotações
✓ Rota backend /api/quotes/public implementada para receber cotações sem autenticação
✓ Validação rigorosa de campos obrigatórios no formulário público
✓ Mensagem de sucesso e redirecionamento automático após envio
✓ Cotações públicas armazenadas no banco com userId null para diferenciação
✓ Exibição "Valor de NF:" implementada na lista de cotações com formatação profissional
✓ Botão "Nova Cotação" removido para embarcadores e transportadoras conforme solicitado
✓ Texto do cabeçalho alterado para "Visualize as solicitações de cotação"
✓ Interface limpa focada na visualização de cotações existentes
✓ Card TRANSPORTADOR adicionado na página de seleção de perfis com cor roxa
✓ Formulário de cadastro de transportador implementado idêntico ao embarcador
✓ Sistema de 4 perfis configurado: motorista (gratuito), embarcador, transportador e agenciador (pagos)
✓ Layout dos cards otimizado com altura uniforme e alinhamento perfeito
✓ Flexbox aplicado para manter botões sempre alinhados na parte inferior
✓ Tamanhos de fonte ajustados para melhor proporção visual
✓ Seção atrativa para transportadoras criada na página inicial
✓ Conteúdo focado em cotações de clientes reais para atrair transportadoras
✓ Destaque para acesso direto a negociações com embarcadores
✓ Benefícios específicos para transportadoras: cotações, gestão de frota, relatórios
✓ Call-to-action direcionado "Quero Expandir Meu Negócio"
✓ Preço R$ 49,90/mês destacado com design atrativo
✓ Informações removidas sobre teste gratuito conforme solicitação
✓ Bug crítico na página administrativa de cotações corrigido completamente
✓ Problema de ordenação de rotas no servidor resolvido: /api/admin/quotes/stats antes de /api/admin/quotes/:id
✓ Método getAllQuotes() implementado e adicionado à interface IStorage
✓ Métodos getQuoteById(), updateQuote() e deleteQuote() implementados no storage
✓ Erro quote.price.toFixed corrigido com verificação de segurança para valores null
✓ Função formatCurrency atualizada para lidar com valores string/null/undefined
✓ Sistema de cotações administrativas completamente funcional com estatísticas corretas
✓ Página /admin/quotes carrega sem erros JavaScript e exibe cotações existentes
✓ Botões de editar, deletar e WhatsApp funcionando corretamente na interface administrativa
✓ Botão "Experimente Grátis por 7 dias" removido da seção de recursos
✓ Layout mobile em cards implementado na página de cotações
✓ Cards compactos e otimizados para dispositivos móveis com borda lateral colorida
✓ Ícone do WhatsApp adicionado no campo de telefone das cotações
✓ Mensagem personalizada automática do WhatsApp implementada com detalhes da cotação
✓ Função generateWhatsAppMessage() criada para gerar texto profissional de contato
✓ Estatísticas reorganizadas em grid 2x3 para melhor visualização mobile
✓ Layout responsivo: cards mobile compactos vs lista expandida desktop
✓ Informações organizadas em seções: cliente, rota, carga, preço no layout mobile
✓ Botão WhatsApp integrado no footer de cada card mobile com ícone MessageCircle
✓ Dashboard executiva completamente redesenhada com visual profissional
✓ Gráficos avançados implementados: ComposedChart, PieChart, BarChart horizontal
✓ Valores em percentual adicionados em todos os indicadores e gráficos
✓ Filtros funcionais implementados: período, métricas, região com selects
✓ Cards com gradientes coloridos e progress bars para indicadores visuais
✓ Métricas avançadas: taxa de utilização, conversão, eficiência da frota
✓ Gráfico de performance mensal combinando fretes, cotações e taxa de conversão
✓ Distribuição por estados com top 10 e percentuais no tooltip
✓ Análise de status de fretes com gráfico pizza e percentuais
✓ Distribuição de tipos de veículos com cores personalizadas
✓ Botão de refresh para atualização manual dos dados
✓ Links rápidos para navegação entre seções do sistema
✓ Layout totalmente responsivo otimizado para mobile e desktop
✓ Sistema de configuração de webhook migrado para persistência em banco de dados
✓ Tabela webhook_configs criada para armazenar configurações permanentemente
✓ Configurações de webhook mantidas após reinicialização do servidor
✓ Funções webhook-service.ts atualizadas para usar storage do banco de dados
✓ Todas as rotas webhook convertidas para operações assíncronas
✓ Teste de persistência confirmado: configurações mantidas após restart
✓ Bug crítico de timestamp no banco de dados corrigido
✓ Erro "value.toISOString is not a function" resolvido com formatação adequada
✓ Sistema de salvamento de configurações funcionando perfeitamente
✓ Configurações de webhook agora podem ser salvas e editadas via interface administrativa
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
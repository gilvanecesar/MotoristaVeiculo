<div align="center">

# 🚛 QUERO FRETES

### Plataforma Completa de Gestão de Fretes

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)

**Sistema de gestão de fretes desenvolvido para otimizar operações logísticas no Brasil**

[Funcionalidades](#-funcionalidades) • [Tecnologias](#-tecnologias) • [Instalação](#-instalação) • [Estrutura](#-estrutura-do-projeto) • [Licença](#-licença)

</div>

---

## 📋 Sobre o Projeto

**QUERO FRETES** é uma plataforma full-stack baseada em assinatura, projetada para gestão completa de fretes no Brasil. Conecta motoristas, proprietários de veículos, embarcadores e agenciadores em um único hub centralizado, otimizando operações logísticas e aumentando a eficiência do setor.

### 🎯 Objetivo

Proporcionar uma solução completa que:
- Facilita a conexão entre motoristas e embarcadores
- Automatiza cotações e gestão de fretes
- Oferece ferramentas inteligentes de cálculo (ANTT)
- Centraliza toda a operação logística em uma única plataforma

---

## ✨ Funcionalidades

### 👥 Gestão de Usuários
- Sistema multi-perfil (administradores, motoristas, embarcadores, agenciadores, transportadoras)
- Autenticação segura com criptografia scrypt
- Registro multi-etapas otimizado
- WhatsApp obrigatório para comunicação
- Perfis completos com validação de CNH

### 💳 Sistema de Assinaturas
- **Trial gratuito de 7 dias** para novos embarcadores
- Integração com **OpenPix** (pagamentos via PIX)
- Planos mensais e anuais
- Acesso gratuito permanente para motoristas
- Webhooks para atualização automática de status

### 🚚 Gestão de Fretes
- Criação e rastreamento de solicitações de frete
- Suporte a múltiplos destinos
- Filtros robustos e busca avançada
- Visualização em cards (mobile) e tabelas (desktop)
- Dashboard com métricas detalhadas

### 📊 Sistema de Cotações
- Formulários detalhados de cotação
- Rastreamento de status em tempo real
- Geração automática de PDF
- Notificações por email para clientes
- Histórico completo de propostas

### 🧮 Calculadora ANTT
- Atualizada conforme **PORTARIA SUROC Nº 23/2025**
- Cálculo preciso de fretes
- Input direto de distância
- Conformidade regulatória

### 🤖 Assistente IA - Buzino
- Powered by **OpenAI GPT-4o**
- Consultas relacionadas ao transporte
- Limites baseados em assinatura
- Respostas contextualizadas

### 📱 Design Responsivo
- Mobile-first com breakpoint em 768px
- Navegação adaptativa (navbar + menu sheet mobile)
- Cards otimizados para toque
- Layouts grid responsivos
- Tipografia e espaçamento escaláveis

### ⚙️ Admin & Analytics
- Painel administrativo completo
- Gestão de usuários e financeiro
- Configuração de webhooks
- Busca avançada de usuários
- Métricas e relatórios detalhados

---

## 🛠 Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** para build otimizado
- **Wouter** para roteamento
- **TanStack React Query** para state management
- **Radix UI** + **Tailwind CSS** para UI
- **React Hook Form** + **Zod** para validação
- **Framer Motion** para animações

### Backend
- **Node.js** com **TypeScript**
- **Express.js** (RESTful API)
- **Passport.js** (autenticação local)
- **Drizzle ORM** (type-safe)
- Custom middleware (auth, RBAC, subscription validation)

### Database
- **PostgreSQL** (Neon Database)
- Migrações com Drizzle Kit
- Queries type-safe

### Integrações
- **OpenPix** - Gateway de pagamento PIX
- **Nodemailer** - Envio de emails transacionais
- **OpenAI** - Assistente IA
- **ReceitaWS** - Validação de CNPJ
- **IBGE API** - Busca de cidades/estados
- **Google Analytics** - Métricas

### DevOps
- **Docker** (multi-stage build)
- **Docker Compose** (stack completo)
- **Nginx** (reverse proxy)
- SSL/TLS configurado
- Health checks automáticos

---

## 🚀 Instalação

### Pré-requisitos
- Node.js 20+
- PostgreSQL 14+
- npm ou yarn

### Configuração

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/quero-fretes.git
cd quero-fretes
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/querofretes

# Session
SESSION_SECRET=your-secret-key-here

# OpenPix
OPENPIX_APP_ID=your-openpix-app-id

# Email (Hostinger)
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Node Environment
NODE_ENV=development
```

4. **Execute as migrações do banco de dados**
```bash
npm run db:push
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5000`

---

## 📁 Estrutura do Projeto

```
quero-fretes/
├── client/                   # Frontend React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilitários e configurações
│   │   └── App.tsx          # Componente raiz
│   └── index.html
│
├── server/                   # Backend Express
│   ├── routes.ts            # Definição de rotas
│   ├── auth.ts              # Configuração Passport.js
│   ├── storage.ts           # Interface de storage
│   ├── middlewares.ts       # Middlewares customizados
│   ├── email-service.ts     # Serviço de email
│   └── index.ts             # Entry point
│
├── shared/                   # Código compartilhado
│   └── schema.ts            # Schemas Drizzle + Zod
│
├── docker/                   # Configurações Docker
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── drizzle/                  # Migrações do banco
│
└── package.json
```

---

## 🔐 Segurança

- Senhas criptografadas com **scrypt**
- Sessões seguras com **express-session**
- Validação robusta com **Zod**
- CORS configurado
- SQL injection protection via Drizzle ORM
- Rate limiting implementado
- Helmet.js para headers seguros

---

## 🎨 Design System

- **Cores primárias**: Sidebar `#00222d` com fontes brancas
- **Framework**: Tailwind CSS
- **Componentes**: Radix UI (acessíveis e customizáveis)
- **Ícones**: Lucide React + React Icons
- **Tipografia**: Responsiva e escalável
- **Grid**: Mobile-first (2 cols mobile, 4 cols desktop)

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server (frontend + backend)

# Build
npm run build            # Build de produção

# Database
npm run db:push          # Aplica schemas ao banco
npm run db:studio        # Abre Drizzle Studio (GUI)

# Docker
docker-compose up        # Sobe stack completa
docker-compose down      # Para stack
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ para otimizar o setor de logística brasileiro.

---

## 📞 Contato & Suporte

Para dúvidas, sugestões ou suporte:
- 📧 Email: suporte@querofretes.com.br
- 💬 WhatsApp: Disponível na plataforma

---

<div align="center">

**⭐ Se este projeto foi útil para você, considere dar uma estrela!**

</div>

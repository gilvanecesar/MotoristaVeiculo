#!/bin/bash

# Script para migrar banco de dados para VPS
# Execute este script na VPS após configurar PostgreSQL

echo "🔄 Iniciando migração do banco para VPS..."

# 1. Verificar se PostgreSQL está rodando
if ! systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL não está rodando. Iniciando..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# 2. Configurar variáveis de ambiente para VPS
echo "📝 Configurando variáveis de ambiente..."
cat > .env.vps << EOF
# Configurações de Banco de Dados VPS
DATABASE_URL=postgresql://querofretes:SuaSenhaSegura123!@localhost:5432/querofretes_db
PGHOST=localhost
PGPORT=5432
PGUSER=querofretes
PGPASSWORD=SuaSenhaSegura123!
PGDATABASE=querofretes_db

# Configurações de Email
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=gilvane.cesar@querofretes.com.br
EMAIL_PASS=SuaSenhaEmailAqui

# Configurações OpenPix
OPENPIX_AUTHORIZATION=Q2xpZW50X0lkX2E4MDg5OGI1LWVkNzgtNDA5Mi1iNjRhLTFhMmIzZjBkMTc2MzpDbGllbnRfU2VjcmV0X3JHU1pGdWFiZXZ3SVlDcWt1dnNYV05SVHFTNmsvUUxpbzZ2enZ

# Configurações de Sessão
SESSION_SECRET=$(openssl rand -base64 32)

# Ambiente
NODE_ENV=production

# Configurações N8N
N8N_WEBHOOK_URL=SuaUrlN8NAqui
EOF

echo "✅ Arquivo .env.vps criado"

# 3. Instalar dependências do projeto
echo "📦 Instalando dependências..."
npm ci --only=production

# 4. Executar migrações do Drizzle
echo "🔧 Executando migrações do banco..."
npm run db:push

echo "✅ Migração concluída!"
echo "🔧 Próximos passos:"
echo "   1. Copie .env.vps para .env"
echo "   2. Configure suas senhas reais"
echo "   3. Execute: npm run build"
echo "   4. Execute: npm start"
EOF
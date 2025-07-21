#!/bin/bash

# Script completo para setup da VPS com migração do banco
# Execute como: bash vps-setup-complete.sh

set -e

echo "🚀 Configurando QUERO FRETES na VPS..."

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependências
echo "🔧 Instalando dependências..."
sudo apt install -y curl wget git nano htop unzip software-properties-common postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# 3. Configurar firewall
echo "🔒 Configurando firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Instalar Node.js 20
echo "📝 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 5. Instalar PM2
echo "⚡ Instalando PM2..."
sudo npm install -g pm2

# 6. Configurar PostgreSQL
echo "🗄️ Configurando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar usuário e banco
sudo -u postgres psql -c "CREATE USER querofretes WITH PASSWORD 'QueroFretes2025!@#';"
sudo -u postgres psql -c "CREATE DATABASE querofretes_db OWNER querofretes;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE querofretes_db TO querofretes;"

# 7. Configurar aplicação
echo "🎯 Configurando aplicação..."
mkdir -p /var/www/querofretes
cd /var/www/querofretes

# Criar arquivo de ambiente
cat > .env << EOF
# Configurações de Banco de Dados
DATABASE_URL=postgresql://querofretes:QueroFretes2025!@#@localhost:5432/querofretes_db
PGHOST=localhost
PGPORT=5432
PGUSER=querofretes
PGPASSWORD=QueroFretes2025!@#
PGDATABASE=querofretes_db

# Configurações de Email
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=gilvane.cesar@querofretes.com.br
EMAIL_PASS=CONFIGURAR_SENHA_EMAIL

# Configurações OpenPix
OPENPIX_AUTHORIZATION=Q2xpZW50X0lkX2E4MDg5OGI1LWVkNzgtNDA5Mi1iNjRhLTFhMmIzZjBkMTc2MzpDbGllbnRfU2VjcmV0X3JHU1pGdWFiZXZ3SVlDcWt1dnNYV05SVHFTNmsvUUxpbzZ2enZ

# Configurações de Sessão
SESSION_SECRET=$(openssl rand -base64 32)

# Ambiente
NODE_ENV=production
PORT=5000

# Configurações N8N
N8N_WEBHOOK_URL=CONFIGURAR_URL_N8N
EOF

# 8. Configurar Nginx
echo "🌐 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/querofretes << EOF
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/querofretes /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "✅ Setup da VPS concluído!"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Transfira os arquivos do projeto para /var/www/querofretes"
echo "2. Configure as senhas no arquivo .env"
echo "3. Execute: cd /var/www/querofretes && npm install"
echo "4. Execute: npm run db:push"
echo "5. Execute: npm run build"
echo "6. Inicie com PM2: pm2 start npm --name 'querofretes' -- start"
echo "7. Configure SSL: sudo certbot --nginx -d seu-dominio.com"
echo ""
echo "🔧 Para configurar domínio, edite:"
echo "   sudo nano /etc/nginx/sites-available/querofretes"
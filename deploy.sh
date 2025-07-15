#!/bin/bash

# Script de Implantação Automática - QUERO FRETES
# Execute como: chmod +x deploy.sh && ./deploy.sh

set -e

echo "🚀 Iniciando implantação do QUERO FRETES na VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está rodando como usuário não-root
if [[ $EUID -eq 0 ]]; then
   print_error "Este script não deve ser executado como root"
   exit 1
fi

# Verificar sistema operacional
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    print_error "Este script é apenas para sistemas Linux"
    exit 1
fi

print_status "Verificando sistema..."

# Atualizar sistema
print_status "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências essenciais
print_status "Instalando dependências essenciais..."
sudo apt install -y curl wget git nano htop unzip software-properties-common

# Configurar firewall
print_status "Configurando firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw --force enable

# Instalar Node.js 20.x
print_status "Instalando Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação do Node.js
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js instalado: $node_version"
print_status "NPM instalado: $npm_version"

# Instalar PostgreSQL
print_status "Instalando PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Iniciar e habilitar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Instalar PM2
print_status "Instalando PM2..."
sudo npm install -g pm2

# Criar diretório do projeto
print_status "Configurando diretório do projeto..."
sudo mkdir -p /var/www/querofretes
sudo chown $USER:$USER /var/www/querofretes

# Criar arquivo de configuração do banco
print_status "Configurando banco de dados..."
read -p "Digite a senha para o usuário do banco de dados: " -s db_password
echo

# Criar usuário e banco de dados
sudo -u postgres psql << EOF
CREATE USER querofretes WITH PASSWORD '$db_password';
CREATE DATABASE querofretes_db OWNER querofretes;
GRANT ALL PRIVILEGES ON DATABASE querofretes_db TO querofretes;
\q
EOF

print_status "Banco de dados configurado com sucesso!"

# Criar diretório de logs
mkdir -p /var/www/querofretes/logs

# Criar arquivo .env básico
print_status "Criando arquivo de configuração (.env)..."
cat > /var/www/querofretes/.env << EOF
# Database
DATABASE_URL="postgresql://querofretes:$db_password@localhost:5432/querofretes_db"
PGHOST=localhost
PGPORT=5432
PGUSER=querofretes
PGPASSWORD=$db_password
PGDATABASE=querofretes_db

# Server
NODE_ENV=production
PORT=5000

# Session Secret (altere para uma chave segura)
SESSION_SECRET=$(openssl rand -base64 32)

# OpenPix (configure com suas credenciais)
OPENPIX_APP_ID=your_openpix_app_id
OPENPIX_API_KEY=your_openpix_api_key

# Email Service (configure com seu provedor)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# WhatsApp/N8N Integration
N8N_WEBHOOK_URL=https://hooks.n8n.cloud/webhook/your_webhook_id

# Production URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com
EOF

print_status "Arquivo .env criado. IMPORTANTE: Edite /var/www/querofretes/.env com suas credenciais reais!"

# Criar arquivo ecosystem.config.js
print_status "Criando configuração do PM2..."
cat > /var/www/querofretes/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'querofretes',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Criar script de backup
print_status "Criando script de backup..."
cat > /var/www/querofretes/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/querofretes"
DB_NAME="querofretes_db"
DB_USER="querofretes"

mkdir -p $BACKUP_DIR

# Backup do banco
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/querofretes

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
EOF

chmod +x /var/www/querofretes/backup.sh

# Criar diretório de backup
sudo mkdir -p /var/backups/querofretes
sudo chown $USER:$USER /var/backups/querofretes

# Instalar Nginx
print_status "Instalando Nginx..."
sudo apt install -y nginx

# Configurar Nginx
print_status "Configurando Nginx..."
read -p "Digite seu domínio (ex: meusite.com): " domain

sudo cat > /etc/nginx/sites-available/querofretes << EOF
server {
    listen 80;
    server_name $domain www.$domain;

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

# Ativar site no Nginx
sudo ln -s /etc/nginx/sites-available/querofretes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL com Certbot
print_status "Instalando Certbot para SSL..."
sudo apt install -y certbot python3-certbot-nginx

print_warning "Para configurar SSL, execute: sudo certbot --nginx -d $domain -d www.$domain"

# Configurar logrotate
print_status "Configurando rotação de logs..."
sudo cat > /etc/logrotate.d/querofretes << EOF
/var/www/querofretes/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Configurar cron para backup
print_status "Configurando backup automático..."
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/querofretes/backup.sh") | crontab -

print_status "✅ Configuração básica concluída!"
print_warning "PRÓXIMOS PASSOS NECESSÁRIOS:"
echo "1. Transfira os arquivos do projeto para /var/www/querofretes/"
echo "2. Edite o arquivo /var/www/querofretes/.env com suas credenciais reais"
echo "3. Execute os comandos finais:"
echo "   cd /var/www/querofretes"
echo "   npm install"
echo "   npm run build"
echo "   npm run db:push"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo "4. Configure SSL: sudo certbot --nginx -d $domain -d www.$domain"

print_status "🎉 Implantação inicial concluída!"
print_status "Acesse: http://$domain (ou https:// após configurar SSL)"
print_status "Logs da aplicação: pm2 logs querofretes"
print_status "Status da aplicação: pm2 status"
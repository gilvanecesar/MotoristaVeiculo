# Guia de Implantação - QUERO FRETES na VPS

## Pré-requisitos da VPS

### Sistema Operacional
- Ubuntu 20.04 LTS ou superior
- Debian 11 ou superior
- CentOS 8 ou superior

### Especificações Mínimas
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 40GB SSD
- **Largura de Banda**: 100Mbps

## Passo 1: Configuração Inicial da VPS

### 1.1 Atualize o sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instale dependências essenciais
```bash
sudo apt install -y curl wget git nano htop unzip software-properties-common
```

### 1.3 Configure o firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

## Passo 2: Instalar Node.js

### 2.1 Instale Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.2 Verifique a instalação
```bash
node --version
npm --version
```

## Passo 3: Instalar PostgreSQL

### 3.1 Instale PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 3.2 Configure o PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.3 Crie o banco de dados
```bash
sudo -u postgres psql
```

No prompt do PostgreSQL, execute:
```sql
CREATE USER querofretes WITH PASSWORD 'sua_senha_segura_aqui';
CREATE DATABASE querofretes_db OWNER querofretes;
GRANT ALL PRIVILEGES ON DATABASE querofretes_db TO querofretes;
\q
```

## Passo 4: Instalar PM2 (Gerenciador de Processos)

```bash
sudo npm install -g pm2
```

## Passo 5: Clonar e Configurar o Projeto

### 5.1 Crie o diretório do projeto
```bash
cd /var/www
sudo mkdir querofretes
sudo chown $USER:$USER querofretes
cd querofretes
```

### 5.2 Transfira os arquivos do projeto
Você pode usar SCP, SFTP ou Git. Exemplo com SCP:
```bash
# No seu computador local (dentro da pasta do projeto)
scp -r . usuario@ip_da_vps:/var/www/querofretes/
```

### 5.3 Instale as dependências
```bash
cd /var/www/querofretes
npm install
```

## Passo 6: Configurar Variáveis de Ambiente

### 6.1 Crie o arquivo .env
```bash
nano .env
```

### 6.2 Configure as variáveis (substitua pelos seus valores):
```env
# Database
DATABASE_URL="postgresql://querofretes:sua_senha_segura_aqui@localhost:5432/querofretes_db"
PGHOST=localhost
PGPORT=5432
PGUSER=querofretes
PGPASSWORD=sua_senha_segura_aqui
PGDATABASE=querofretes_db

# Server
NODE_ENV=production
PORT=5000

# OpenPix (suas credenciais reais)
OPENPIX_APP_ID=sua_app_id_openpix
OPENPIX_API_KEY=sua_chave_api_openpix

# Email Service (configure com seu provedor)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app_gmail

# Session Secret (gere uma chave aleatória)
SESSION_SECRET=sua_chave_secreta_muito_longa_e_aleatoria

# WhatsApp/N8N Integration
N8N_WEBHOOK_URL=https://hooks.n8n.cloud/webhook/seu_webhook_id

# Production URLs
FRONTEND_URL=https://seu-dominio.com
BACKEND_URL=https://seu-dominio.com
```

## Passo 7: Configurar o Banco de Dados

### 7.1 Execute as migrações
```bash
npm run db:push
```

### 7.2 Crie o usuário administrador
```bash
node -e "
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await pool.query(\`
    INSERT INTO users (email, password, name, profile_type, is_verified, is_active, subscription_active, subscription_type, subscription_expires_at)
    VALUES ('admin@querofretes.com', $1, 'Administrador', 'administrador', true, true, true, 'unlimited', '2030-12-31T23:59:59Z')
    ON CONFLICT (email) DO NOTHING
  \`, [hashedPassword]);
  
  console.log('Usuário administrador criado!');
  await pool.end();
}

createAdmin();
"
```

## Passo 8: Configurar SSL (Opcional mas Recomendado)

### 8.1 Instale Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Instale Nginx
```bash
sudo apt install -y nginx
```

### 8.3 Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/querofretes
```

Adicione a configuração:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8.4 Ative o site
```bash
sudo ln -s /etc/nginx/sites-available/querofretes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8.5 Obtenha o certificado SSL
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## Passo 9: Configurar PM2 para Produção

### 9.1 Crie o arquivo ecosystem.config.js
```bash
nano ecosystem.config.js
```

```javascript
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
```

### 9.2 Crie o diretório de logs
```bash
mkdir logs
```

### 9.3 Build do projeto
```bash
npm run build
```

### 9.4 Inicie com PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Passo 10: Configurar Auto-start do Sistema

### 10.1 Configure PM2 para iniciar automaticamente
```bash
pm2 startup ubuntu
# Execute o comando que o PM2 mostrar
pm2 save
```

## Passo 11: Configurar Monitoramento

### 11.1 Instale PM2 Plus (opcional)
```bash
pm2 install pm2-server-monit
```

### 11.2 Configure logrotate
```bash
sudo nano /etc/logrotate.d/querofretes
```

```
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
```

## Passo 12: Configurar Backup Automático

### 12.1 Crie script de backup
```bash
nano backup.sh
```

```bash
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
```

### 12.2 Torne executável e configure cron
```bash
chmod +x backup.sh
crontab -e
```

Adicione para backup diário às 2h da manhã:
```
0 2 * * * /var/www/querofretes/backup.sh
```

## Comandos Úteis para Manutenção

### Verificar status da aplicação
```bash
pm2 status
pm2 logs querofretes
```

### Reiniciar aplicação
```bash
pm2 restart querofretes
```

### Atualizar aplicação
```bash
cd /var/www/querofretes
git pull origin main  # ou como você faz deploy
npm install
npm run build
pm2 reload querofretes
```

### Verificar uso de recursos
```bash
htop
pm2 monit
```

## Troubleshooting

### Se a aplicação não iniciar:
1. Verifique logs: `pm2 logs querofretes`
2. Verifique se o banco está rodando: `sudo systemctl status postgresql`
3. Verifique conexão com banco: `psql -h localhost -U querofretes -d querofretes_db`

### Se houver erro de permissão:
```bash
sudo chown -R $USER:$USER /var/www/querofretes
```

### Para verificar se a aplicação está respondendo:
```bash
curl http://localhost:5000
```

## Segurança Adicional

### 1. Configure fail2ban
```bash
sudo apt install -y fail2ban
```

### 2. Desabilite login root via SSH
```bash
sudo nano /etc/ssh/sshd_config
# Mude: PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Configure backups automáticos do banco
```bash
# Já configurado no script de backup acima
```

## Suporte

Se encontrar algum problema:
1. Verifique os logs: `pm2 logs`
2. Verifique status dos serviços: `sudo systemctl status postgresql nginx`
3. Verifique conectividade: `curl http://localhost:5000`

**Importante**: Substitua todos os valores de exemplo (senhas, domínios, chaves API) pelos seus valores reais antes de usar em produção.
# 🚀 Guia de Deploy - QUERO FRETES (Janeiro 2025)

## 📋 Status Atual do Sistema

### ✅ Funcionalidades Implementadas
- **Sistema de Fretes**: Gestão completa de fretes e cotações
- **Usuários Multi-perfil**: Administrador, Motorista, Embarcador, Agente, Transportador
- **Pagamentos PIX**: Integração completa OpenPix (único gateway ativo)
- **AI Assistant "Buzino"**: GPT-4o para consultas de transporte
- **Calculadora ANTT**: Cálculo de fretes conforme PORTARIA SUROC Nº 23/2025
- **Sistema de Cotações**: Público e autenticado com PDF e WhatsApp
- **Google Analytics**: Rastreamento completo integrado
- **Email System**: Nodemailer com múltiplos provedores
- **Webhooks N8N**: Automação de dados de usuários
- **API IBGE**: 5.571 cidades brasileiras com busca inteligente
- **ReceitaWS**: Validação automática de CNPJ
- **Tema Dark/Light**: Sistema condicional baseado na preferência do usuário

### 🎯 Deploy Recomendado

**REPLIT DEPLOY DIRETO** (Recomendado para produção)
- Deploy em 1 clique
- SSL automático (.replit.app)
- PostgreSQL Neon integrado
- Monitoramento built-in
- Custo: ~$20-40/mês

## 🚀 OPÇÃO 1: Deploy Replit (Recomendado)

### Pré-requisitos
- Conta Replit Core ($20/mês)
- Chaves API configuradas nos Secrets

### Configuração de Secrets
Configure no painel Replit > Secrets:

```env
# OpenAI (Obrigatório - AI Assistant)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxx

# Google Analytics (Recomendado)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Email (Configure um provedor)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu.email@gmail.com
SMTP_PASS=sua_senha_de_app

# OpenPix (Pagamentos PIX)
OPENPIX_APP_ID=sua_chave_openpix

# N8N Automation (Opcional)
N8N_WEBHOOK_URL=https://sua-instancia.n8n.cloud/webhook/usuario
```

### Deploy
1. **Push para main**: `git push origin main`
2. **Clique em Deploy** no painel Replit
3. **Configure domínio personalizado** (opcional)
4. **Teste funcionalidades** principais

---

## 🐳 OPÇÃO 2: Deploy Docker/VPS

### Especificações VPS Recomendadas
- **CPU**: 2+ vCPUs
- **RAM**: 4GB+
- **Storage**: 40GB+ SSD
- **OS**: Ubuntu 22.04 LTS

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

### Instalação Docker (Recomendada)
```bash
# Usar arquivos Docker já preparados
chmod +x docker-setup.sh
./docker-setup.sh auto
```

## 📦 PORTAINER + VERSIONAMENTO + DADOS

### Como Funciona a Persistência
- **Docker Volumes**: Dados ficam em volumes separados do código
- **Updates**: Só o código muda, dados permanecem intactos
- **Rollback**: Código volta, banco continua atual

### Workflow Portainer + Git
```bash
# 1. Desenvolvimento local
git add .
git commit -m "nova funcionalidade"
git push origin main

# 2. Deploy via Portainer
# - Acesse Portainer: http://vps:9000
# - Stacks > quero-fretes > Pull and Redeploy
# - Dados permanecem seguros automaticamente

# 3. Verificação
curl http://seu-dominio/api/health
```

### Estrutura de Volumes Docker
```yaml
# docker-compose.yml (já configurado)
volumes:
  postgres_data:     # Banco PostgreSQL persiste aqui
    driver: local
  app_uploads:       # Uploads de usuários (se houver)
    driver: local
```

### Backup Recomendado (Antes de Updates Grandes)
```bash
# Via Portainer Console ou SSH da VPS
docker exec quero_fretes_db pg_dump -U querofretes querofretes_db > backup_$(date +%Y%m%d).sql

# Backup automático (opcional - cron da VPS)
0 2 * * * docker exec quero_fretes_db pg_dump -U querofretes querofretes_db > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Processo de Update via Portainer
1. **Git Push**: Código para repositório
2. **Portainer**: Pull and Redeploy na Stack
3. **Volumes**: Dados PostgreSQL permanecem intactos
4. **Aplicação**: Nova versão + dados existentes
5. **Zero Downtime**: Usuários continuam logados

### Troubleshooting Banco + Portainer
```bash
# Verificar volumes
docker volume ls | grep postgres

# Verificar dados do banco
docker exec -it quero_fretes_db psql -U querofretes -d querofretes_db -c "SELECT COUNT(*) FROM users;"

# Logs do banco
docker logs quero_fretes_db

# Conexão direta
docker exec -it quero_fretes_db psql -U querofretes querofretes_db
```

### Instalação Manual - Configure .env:
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

# OpenAI (Obrigatório - AI Assistant "Buzino")
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxx

# Google Analytics (Recomendado)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# OpenPix (Obrigatório - Pagamentos PIX)
OPENPIX_APP_ID=sua_app_id_openpix

# Email Service (Configure um provedor)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app_gmail

# Session Secret (gere uma chave aleatória)
SESSION_SECRET=sua_chave_secreta_muito_longa_e_aleatoria

# N8N Webhooks (Opcional - Automação)
N8N_WEBHOOK_URL=https://sua-instancia.n8n.cloud/webhook/usuario

# APIs Brasileiras (Já configuradas)
RECEITA_WS_API_URL=https://www.receitaws.com.br/v1
IBGE_API_URL=https://servicodados.ibge.gov.br/api/v1

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
# Use o script já preparado
node create-admin.js
```

**Ou manual via SQL:**
```sql
# Conectar ao banco
psql -h localhost -U querofretes -d querofretes_db

# Criar usuário admin (ajuste a senha hash conforme necessário)
INSERT INTO users (
  email, password, name, profile_type, 
  is_verified, is_active, subscription_active, 
  subscription_type, subscription_expires_at
) VALUES (
  'admin@querofretes.com', 
  '$2b$10$exemplo_hash_bcrypt_da_senha', 
  'Administrador', 
  'administrador', 
  true, true, true, 
  'unlimited', 
  '2030-12-31T23:59:59Z'
) ON CONFLICT (email) DO NOTHING;
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

---

## ✅ CHECKLIST DE FUNCIONALIDADES - TESTE PÓS-DEPLOY

### 🔐 Autenticação e Usuários
- [ ] Login/logout funcionando
- [ ] Criação de conta (diferentes perfis)
- [ ] Recuperação de senha por email
- [ ] Painel administrativo acessível

### 💰 Sistema de Pagamentos (OpenPix)
- [ ] Geração de cobrança PIX
- [ ] Webhook de confirmação funcionando
- [ ] Ativação automática de assinatura
- [ ] Dashboard financeiro administrativo

### 🤖 AI Assistant "Buzino"
- [ ] Chat funcional na página /ai-assistant
- [ ] Respostas do GPT-4o
- [ ] Limite de mensagens por perfil
- [ ] Histórico de conversas

### 📊 Calculadora ANTT
- [ ] Cálculo de frete por distância manual
- [ ] Diferentes tipos de veículo
- [ ] Geração de PDF da cotação
- [ ] Conformidade PORTARIA SUROC Nº 23/2025

### 🚚 Sistema de Fretes
- [ ] Criação de novos fretes
- [ ] Gestão de motoristas e veículos
- [ ] Sistema de cotações (público e autenticado)
- [ ] Compartilhamento via WhatsApp

### 🌎 APIs Brasileiras
- [ ] Busca de cidades IBGE (5.571 cidades)
- [ ] Validação CNPJ via ReceitaWS
- [ ] Autocomplete inteligente de localidades

### 📧 Sistema de Email
- [ ] Emails transacionais funcionando
- [ ] Confirmação de cadastro
- [ ] Notificações de pagamento
- [ ] Recuperação de senha

### 📈 Analytics e Integração
- [ ] Google Analytics rastreando
- [ ] Webhooks N8N enviando dados
- [ ] Tema dark/light funcional
- [ ] Responsividade mobile

## 🧪 COMANDOS DE TESTE

### Verificar Status da Aplicação
```bash
# Status geral
curl http://localhost:5000/api/health

# Testar banco de dados
curl http://localhost:5000/api/public/stats

# Verificar cidades IBGE
curl "http://localhost:5000/api/ibge/cities?search=São Paulo"
```

### Testar Funcionalidades Principais
```bash
# 1. Criar usuário teste via API
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"123456","name":"Teste","profileType":"embarcador"}'

# 2. Fazer login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"123456"}'

# 3. Testar IA (substitua SESSION_ID)
curl -X POST http://localhost:5000/api/ai-assistant/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SESSION_ID" \
  -d '{"message":"Como calcular frete de carga seca?"}'
```

### Monitoramento Contínuo
```bash
# Logs da aplicação
pm2 logs querofretes --lines 50

# Status dos processos
pm2 status

# Uso de recursos
pm2 monit

# Verificar conexões de banco
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

## 🚨 TROUBLESHOOTING COMUM

### AI Assistant Não Responde
```bash
# Verificar se OPENAI_API_KEY está configurada
echo $OPENAI_API_KEY

# Testar conexão OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.openai.com/v1/models
```

### Pagamentos PIX Não Funcionam
```bash
# Verificar webhook OpenPix
curl -X POST http://localhost:5000/api/openpix/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"OPENPIX_CHARGE_COMPLETED","charge":{"correlationID":"test"}}'
```

### Emails Não Enviam
```bash
# Testar configuração SMTP
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
transporter.verify((err, success) => {
  console.log(err ? 'ERRO SMTP: ' + err : 'SMTP OK: ' + success);
});
"
```

### Busca de Cidades Lenta
```bash
# Verificar carregamento das cidades IBGE
curl -w "@curl-format.txt" -s "http://localhost:5000/api/ibge/cities?search=São"

# curl-format.txt:
# time_total: %{time_total}
# time_connect: %{time_connect}
# time_namelookup: %{time_namelookup}
```

## 📞 SUPORTE E MANUTENÇÃO

### Backup Diário Recomendado
```bash
# Backup do banco
pg_dump -h localhost -U querofretes querofretes_db > backup_$(date +%Y%m%d).sql

# Backup dos arquivos
tar -czf backup_files_$(date +%Y%m%d).tar.gz /var/www/querofretes

# Backup das configurações
cp .env .env.backup.$(date +%Y%m%d)
```

### Updates de Segurança
```bash
# Sistema
sudo apt update && sudo apt upgrade -y

# Node.js dependencies
npm audit fix

# PostgreSQL
sudo apt update postgresql
```

## 🎯 MÉTRICAS DE SUCESSO

Após deploy, monitore:
- **Response Time**: < 500ms páginas principais
- **Uptime**: > 99.5%
- **Database Connections**: < 80% do limite
- **Memory Usage**: < 70% da RAM disponível
- **Disk Space**: < 80% utilizado

---

**✅ Deploy Concluído!** O QUERO FRETES está pronto para produção com todas as funcionalidades operacionais.

**Importante**: Substitua todos os valores de exemplo (senhas, domínios, chaves API) pelos seus valores reais antes de usar em produção.
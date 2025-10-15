# 🚀 Guia de Deploy QUERO FRETES - VPS com Docker (2025)

## 📋 Visão Geral

Este guia mostra como fazer deploy do **QUERO FRETES** em um servidor VPS usando Docker e Docker Compose.

### Arquitetura
- **Container 1**: PostgreSQL 15 (Banco de dados)
- **Container 2**: Aplicação Node.js (Backend + Frontend)
- **Container 3**: Nginx (Reverse Proxy e SSL)

---

## 🖥️ Especificações da VPS

### Recomendado
- **CPU**: 2+ vCPUs
- **RAM**: 4GB+
- **Storage**: 40GB+ SSD
- **OS**: Ubuntu 22.04 LTS ou 24.04 LTS
- **Provedores**: DigitalOcean, Linode, AWS EC2, Contabo, Hetzner

---

## 📦 Passo 1: Preparar a VPS

### 1.1 Acesse sua VPS
```bash
ssh root@seu-servidor-ip
```

### 1.2 Atualize o sistema
```bash
apt update && apt upgrade -y
```

### 1.3 Instale Docker e Docker Compose
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose V2
apt-get install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version
```

### 1.4 Configure o Firewall
```bash
ufw allow OpenSSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable
ufw status
```

---

## 📂 Passo 2: Clonar o Projeto

### 2.1 Instale Git (se necessário)
```bash
apt install git -y
```

### 2.2 Clone o repositório
```bash
cd /opt
git clone https://github.com/seu-usuario/quero-fretes.git
cd quero-fretes
```

### 2.3 Ou envie via SCP do seu computador
```bash
# No seu computador local
scp -r ./quero-fretes root@seu-servidor-ip:/opt/
```

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Crie o arquivo .env
```bash
nano .env
```

### 3.2 Configure as variáveis (exemplo completo)
```env
# === DATABASE ===
POSTGRES_DB=querofretes_prod
POSTGRES_USER=querofretes_user
POSTGRES_PASSWORD=SuaSenhaSeguraAqui123!
DATABASE_URL=postgresql://querofretes_user:SuaSenhaSeguraAqui123!@postgres:5432/querofretes_prod

# Variáveis PG para compatibilidade
PGHOST=postgres
PGPORT=5432
PGUSER=querofretes_user
PGPASSWORD=SuaSenhaSeguraAqui123!
PGDATABASE=querofretes_prod

# === NODE ===
NODE_ENV=production
PORT=5000
SESSION_SECRET=gerado-com-openssl-rand-base64-32

# === OPENAI (Obrigatório - AI Assistant "Buzino") ===
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxx

# === OPENPIX (Pagamentos PIX) ===
OPENPIX_APP_ID=sua_chave_openpix
OPENPIX_AUTHORIZATION=seu_token_openpix

# === EMAIL (Configure um provedor) ===
# Opção 1: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu.email@gmail.com
SMTP_PASS=senha_de_app_do_gmail

# Opção 2: Hostinger
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=seu@dominio.com
EMAIL_PASS=sua_senha

# === GOOGLE ANALYTICS (Opcional) ===
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# === N8N AUTOMATION (Opcional) ===
N8N_WEBHOOK_URL=https://sua-instancia.n8n.cloud/webhook/usuario

# === DOMÍNIO (Atualize com seu domínio) ===
DOMAIN=seudominio.com.br
```

### 3.3 Gerar SESSION_SECRET
```bash
openssl rand -base64 32
```

### 3.4 Proteger o arquivo .env
```bash
chmod 600 .env
```

---

## 🐳 Passo 4: Atualizar docker-compose.yml

Crie ou atualize o arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: querofretes-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"  # Só localhost pode acessar
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - querofretes-network

  # Aplicação Node.js
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: querofretes-app
    restart: unless-stopped
    ports:
      - "127.0.0.1:5000:5000"  # Só nginx pode acessar
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: ${DATABASE_URL}
      PGHOST: postgres
      PGPORT: 5432
      PGUSER: ${PGUSER}
      PGPASSWORD: ${PGPASSWORD}
      PGDATABASE: ${PGDATABASE}
      SESSION_SECRET: ${SESSION_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      OPENPIX_APP_ID: ${OPENPIX_APP_ID}
      OPENPIX_AUTHORIZATION: ${OPENPIX_AUTHORIZATION}
      EMAIL_HOST: ${EMAIL_HOST}
      EMAIL_PORT: ${EMAIL_PORT}
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASS: ${EMAIL_PASS}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      VITE_GA_MEASUREMENT_ID: ${VITE_GA_MEASUREMENT_ID}
      N8N_WEBHOOK_URL: ${N8N_WEBHOOK_URL}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - querofretes-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: querofretes-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro  # Para certificados SSL
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - querofretes-network

volumes:
  postgres_data:
  nginx_logs:

networks:
  querofretes-network:
    driver: bridge
```

---

## 🌐 Passo 5: Configurar Nginx

Atualize o arquivo `nginx.conf` com seu domínio:

```nginx
events {
    worker_connections 2048;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types application/json application/javascript text/css text/plain text/xml;

    upstream app_backend {
        server app:5000;
    }

    # HTTP Server - Redireciona para HTTPS
    server {
        listen 80;
        server_name seudominio.com.br www.seudominio.com.br;

        # Permite Let's Encrypt validation
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redireciona todo o resto para HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name seudominio.com.br www.seudominio.com.br;

        # SSL Certificates (será configurado com Let's Encrypt)
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL Configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Client max body size (uploads)
        client_max_body_size 50M;

        # Logs
        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;

        # API endpoints com rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Aplicação principal
        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeout settings
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://app_backend;
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://app_backend/api/health;
        }
    }
}
```

---

## 🔒 Passo 6: Configurar SSL com Let's Encrypt

### 6.1 Instale Certbot
```bash
apt install certbot -y
```

### 6.2 Primeiro, rode sem SSL para validação
Temporariamente, modifique o nginx.conf para NÃO redirecionar para HTTPS e comente as linhas SSL.

```bash
# Inicie os containers
docker compose up -d

# Verifique se está rodando
docker compose ps
curl http://localhost
```

### 6.3 Gere o certificado SSL
```bash
# Pare o nginx temporariamente
docker compose stop nginx

# Gere o certificado (substitua pelo seu domínio e email)
certbot certonly --standalone \
  -d seudominio.com.br \
  -d www.seudominio.com.br \
  --email seu@email.com \
  --agree-tos \
  --non-interactive

# Copie os certificados para a pasta ssl/
mkdir -p ssl
cp /etc/letsencrypt/live/seudominio.com.br/fullchain.pem ssl/
cp /etc/letsencrypt/live/seudominio.com.br/privkey.pem ssl/
chmod 644 ssl/*.pem

# Reinicie o nginx com SSL
docker compose start nginx
```

### 6.4 Configure renovação automática
```bash
# Adicione ao crontab
crontab -e

# Adicione esta linha (renova a cada 12 horas)
0 */12 * * * certbot renew --quiet --post-hook "docker compose -f /opt/quero-fretes/docker-compose.yml restart nginx"
```

---

## 🚀 Passo 7: Build e Deploy

### 7.1 Build das imagens
```bash
cd /opt/quero-fretes
docker compose build --no-cache
```

### 7.2 Inicie os containers
```bash
docker compose up -d
```

### 7.3 Verifique os logs
```bash
# Todos os logs
docker compose logs -f

# Só da aplicação
docker compose logs -f app

# Só do banco
docker compose logs -f postgres
```

### 7.4 Verifique status
```bash
docker compose ps
```

---

## 🗄️ Passo 8: Inicializar o Banco de Dados

### 8.1 Execute as migrations
```bash
# Acesse o container da aplicação
docker exec -it querofretes-app sh

# Rode as migrations
npm run db:push

# Saia do container
exit
```

### 8.2 Crie usuário admin (opcional)
```bash
# Acesse o PostgreSQL
docker exec -it querofretes-postgres psql -U querofretes_user -d querofretes_prod

# Execute o SQL para criar admin
-- Cole os comandos SQL do create-admin.js aqui

# Saia
\q
```

---

## 🔍 Passo 9: Testar a Aplicação

### 9.1 Teste local
```bash
curl http://localhost
curl http://localhost/api/health
```

### 9.2 Teste no navegador
```
http://seudominio.com.br
https://seudominio.com.br
```

### 9.3 Teste funcionalidades principais
- [ ] Login/Cadastro
- [ ] Criação de frete
- [ ] Calculadora ANTT
- [ ] AI Assistant "Buzino"
- [ ] Upload de imagens
- [ ] Pagamento PIX (OpenPix)

---

## 🛠️ Comandos Úteis

### Gerenciar Containers
```bash
# Ver logs em tempo real
docker compose logs -f

# Reiniciar aplicação
docker compose restart app

# Parar tudo
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker compose down -v

# Rebuild após alterações no código
docker compose up -d --build

# Ver uso de recursos
docker stats

# Acessar shell do container
docker exec -it querofretes-app sh
docker exec -it querofretes-postgres sh
```

### Backup do Banco de Dados
```bash
# Criar backup
docker exec querofretes-postgres pg_dump -U querofretes_user querofretes_prod > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20250115.sql | docker exec -i querofretes-postgres psql -U querofretes_user -d querofretes_prod
```

### Monitoramento
```bash
# CPU e Memória
htop

# Espaço em disco
df -h

# Logs do sistema
journalctl -u docker

# Ver redes Docker
docker network ls
docker network inspect querofretes-network
```

---

## 🔄 Atualizações e Deploy Contínuo

### Atualização Manual
```bash
cd /opt/quero-fretes
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
```

### CI/CD com GitHub Actions (Opcional)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/quero-fretes
            git pull origin main
            docker compose down
            docker compose up -d --build
            docker compose logs --tail=50
```

Configure os secrets no GitHub:
- `VPS_HOST`: IP do seu servidor
- `SSH_PRIVATE_KEY`: Chave SSH privada

---

## 📊 Monitoramento com Portainer (Opcional)

### Instalar Portainer
```bash
docker volume create portainer_data

docker run -d \
  --name portainer \
  --restart=unless-stopped \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acesse: `https://seu-servidor-ip:9443`

---

## 🐛 Troubleshooting

### Erro: Container não inicia
```bash
# Ver logs detalhados
docker compose logs app

# Verificar variáveis de ambiente
docker compose config

# Reiniciar do zero
docker compose down -v
docker compose up -d --build
```

### Erro: Banco de dados não conecta
```bash
# Verificar se postgres está rodando
docker compose ps postgres

# Testar conexão
docker exec -it querofretes-postgres psql -U querofretes_user -d querofretes_prod

# Verificar variáveis
echo $DATABASE_URL
```

### Erro: Nginx não acessa a aplicação
```bash
# Verificar rede
docker network inspect querofretes-network

# Testar conectividade
docker exec -it querofretes-nginx ping app

# Ver configuração do Nginx
docker exec -it querofretes-nginx nginx -T
```

### Performance lenta
```bash
# Verificar recursos
docker stats

# Aumentar RAM/CPU na VPS
# Ou otimizar configurações do PostgreSQL
```

---

## 📈 Otimizações de Produção

### 1. PostgreSQL Tuning
Edite dentro do container:
```bash
docker exec -it querofretes-postgres sh
vi /var/lib/postgresql/data/postgresql.conf
```

Adicione:
```conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 128MB
max_connections = 100
```

### 2. Node.js Otimizations
No `.env`:
```env
NODE_OPTIONS=--max-old-space-size=2048
```

### 3. Nginx Cache
Adicione ao `nginx.conf`:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m inactive=60m;
proxy_cache my_cache;
```

---

## 🔐 Segurança

### Checklist de Segurança
- [ ] Firewall configurado (UFW)
- [ ] SSL/TLS ativo (HTTPS)
- [ ] Senhas fortes no .env
- [ ] PostgreSQL só acessível localmente
- [ ] Rate limiting no Nginx
- [ ] Security headers configurados
- [ ] Backups automáticos
- [ ] Logs sendo monitorados
- [ ] Updates automáticos do sistema

### Hardening Adicional
```bash
# Fail2ban para proteção contra brute force
apt install fail2ban -y
systemctl enable fail2ban

# Desabilitar login root SSH
nano /etc/ssh/sshd_config
# PermitRootLogin no
systemctl restart sshd
```

---

## 📞 Suporte

### Logs e Debug
- Aplicação: `docker compose logs -f app`
- Nginx: `docker compose logs -f nginx`
- PostgreSQL: `docker compose logs -f postgres`

### Recursos
- [Docker Docs](https://docs.docker.com/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## ✅ Checklist Final

### Antes do Deploy
- [ ] VPS configurada com Ubuntu 22.04+
- [ ] Docker e Docker Compose instalados
- [ ] Domínio apontando para o IP da VPS
- [ ] Firewall configurado
- [ ] Arquivo .env criado com todas as variáveis
- [ ] SESSION_SECRET gerado

### Depois do Deploy
- [ ] Containers rodando: `docker compose ps`
- [ ] SSL configurado e funcionando
- [ ] Banco de dados inicializado
- [ ] Usuário admin criado
- [ ] Funcionalidades testadas
- [ ] Backups configurados
- [ ] Monitoramento ativo

---

## 🎉 Conclusão

Seu sistema **QUERO FRETES** agora está rodando em produção!

**URLs de acesso:**
- Site: `https://seudominio.com.br`
- Health Check: `https://seudominio.com.br/health`
- API: `https://seudominio.com.br/api/`

**Próximos passos:**
1. Configure backups automáticos diários
2. Implemente monitoramento com Portainer ou Grafana
3. Configure alertas de uptime (UptimeRobot, Pingdom)
4. Documente credenciais em local seguro
5. Treine equipe no uso do sistema

---

**Desenvolvido com ❤️ pela equipe QUERO FRETES**

# 🚀 Deploy Rápido VPS - QUERO FRETES

## Quick Start (5 minutos)

### 1. Pré-requisitos
- VPS com Ubuntu 22.04+ (4GB RAM, 2 vCPUs)
- Domínio apontando para o IP da VPS (opcional)

### 2. Configure as variáveis
```bash
# Copie e edite o .env
cp .env.example .env
nano .env

# Configure pelo menos estas variáveis obrigatórias:
# - POSTGRES_PASSWORD
# - SESSION_SECRET (gere com: openssl rand -base64 32)
# - OPENAI_API_KEY
```

### 3. Execute o script de deploy
```bash
# Torne o script executável
chmod +x vps-deploy.sh

# Execute como root
sudo ./vps-deploy.sh
```

**Pronto! Seu sistema estará rodando em poucos minutos.**

---

## Configurar SSL (HTTPS)

### Após o deploy básico:

```bash
# 1. Instale certbot
apt install certbot -y

# 2. Pare o nginx temporariamente
docker compose stop nginx

# 3. Gere o certificado (substitua seudominio.com.br)
certbot certonly --standalone \
  -d seudominio.com.br \
  -d www.seudominio.com.br \
  --email seu@email.com \
  --agree-tos

# 4. Copie os certificados
mkdir -p ssl
cp /etc/letsencrypt/live/seudominio.com.br/fullchain.pem ssl/
cp /etc/letsencrypt/live/seudominio.com.br/privkey.pem ssl/
chmod 644 ssl/*.pem

# 5. Edite nginx.conf
nano nginx.conf
# Descomente a seção HTTPS (server block com listen 443)
# Atualize server_name com seu domínio

# 6. Reinicie o nginx
docker compose start nginx
```

### Renovação automática SSL
```bash
# Adicione ao crontab
crontab -e

# Adicione esta linha:
0 */12 * * * certbot renew --quiet --post-hook "docker compose -f /opt/quero-fretes/docker-compose.yml restart nginx"
```

---

## Comandos Úteis

### Ver logs
```bash
docker compose logs -f app
```

### Reiniciar
```bash
docker compose restart app
```

### Parar tudo
```bash
docker compose down
```

### Backup banco de dados
```bash
docker exec querofretes-postgres pg_dump -U querofretes_user querofretes_prod > backup.sql
```

### Atualizar código
```bash
git pull origin main
docker compose down
docker compose up -d --build
```

---

## Checklist Pós-Deploy

- [ ] Testar acesso ao site
- [ ] Criar usuário administrador
- [ ] Testar login e funcionalidades
- [ ] Configurar SSL (HTTPS)
- [ ] Configurar backup automático
- [ ] Configurar monitoramento (opcional)

---

## Documentação Completa

Para instruções detalhadas, consulte:
- **[VPS_DOCKER_DEPLOY_2025.md](VPS_DOCKER_DEPLOY_2025.md)** - Guia completo e detalhado
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guia geral de deployment

---

## Suporte

Problemas? Verifique:
1. Logs: `docker compose logs -f`
2. Status: `docker compose ps`
3. Variáveis: `docker compose config`

---

**Desenvolvido com ❤️ pela equipe QUERO FRETES**

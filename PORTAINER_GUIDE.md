# 🐳 GUIA PORTAINER - QUERO FRETES

## 🎯 Deploy Exclusivo via Portainer

Este guia é específico para instalar o QUERO FRETES usando apenas Portainer, sem configurações manuais.

---

## 📋 PRÉ-REQUISITOS

### 1. VPS Configurada
- **OS**: Ubuntu 20.04+ ou Debian 11+
- **RAM**: 4GB mínimo
- **Storage**: 40GB+ SSD
- **CPU**: 2+ vCPUs

### 2. Docker + Portainer Instalados
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Portainer
docker volume create portainer_data
docker run -d -p 8000:8000 -p 9000:9000 \
  --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

### 3. Firewall (se necessário)
```bash
# Liberar portas
sudo ufw allow 9000/tcp  # Portainer
sudo ufw allow 5000/tcp  # Aplicação
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
```

---

## 🚀 DEPLOY VIA PORTAINER

### PASSO 1: Acessar Portainer
1. Abra: `http://SEU_IP_VPS:9000`
2. Crie usuário admin na primeira vez
3. Selecione "Docker" como ambiente

### PASSO 2: Criar Stack
1. **Menu**: Stacks
2. **Botão**: "+ Add stack"
3. **Nome**: `quero-fretes`
4. **Build method**: Repository

### PASSO 3: Configurar Repository
```
Repository URL: https://github.com/SEU_USUARIO/quero-fretes.git
Reference: refs/heads/main
Compose path: docker-compose.yml
```
- ✅ Marque "Auto-pull" para updates automáticos

### PASSO 4: Environment Variables

#### OBRIGATÓRIAS (Mínimo para funcionar):
```env
DATABASE_URL=postgresql://querofretes:SUA_SENHA_FORTE@postgres:5432/querofretes_db
POSTGRES_DB=querofretes_db
POSTGRES_USER=querofretes
POSTGRES_PASSWORD=SUA_SENHA_FORTE
PGUSER=querofretes
PGPASSWORD=SUA_SENHA_FORTE
PGDATABASE=querofretes_db
SESSION_SECRET=chave_session_muito_longa_e_aleatoria_123456789
```

#### RECOMENDADAS (Para recursos completos):
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxx
OPENPIX_APP_ID=sua_app_id_openpix
OPENPIX_AUTHORIZATION=sua_authorization_openpix
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=contato@querofretes.com.br
EMAIL_PASS=sua_senha_email
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### OPCIONAIS (Pode adicionar depois):
```env
N8N_WEBHOOK_URL=https://sua-instancia.n8n.cloud/webhook/usuario
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu.email@gmail.com
SMTP_PASS=sua_senha_app_gmail
```

### PASSO 5: Deploy
1. Clique **"Deploy the stack"**
2. Aguarde build (5-10 minutos)
3. Verifique logs nos containers

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### 1. Verificar Containers
Na aba **Containers**, deve aparecer:
- `quero-fretes_postgres_1` (rodando)
- `quero-fretes_app_1` (rodando)

### 2. Testar Aplicação
```bash
# Via browser
http://SEU_IP_VPS:5000

# Via curl
curl http://SEU_IP_VPS:5000/api/health
```

### 3. Verificar Banco
```bash
# Via Portainer Console (container postgres)
psql -U querofretes -d querofretes_db -c "SELECT COUNT(*) FROM users;"
```

---

## 🔄 ATUALIZAÇÕES AUTOMÁTICAS

### Via Portainer (1 clique):
1. **Stacks** → **quero-fretes**
2. **Pull and redeploy**
3. Aguarde rebuild

### Via Git (recomendado):
1. Faça push das alterações:
```bash
git add .
git commit -m "nova funcionalidade"
git push origin main
```
2. Portainer detecta automaticamente (se auto-pull ativo)

---

## 🛠️ GERENCIAMENTO VIA PORTAINER

### Logs em Tempo Real
1. **Containers** → **quero-fretes_app_1**
2. **Logs** → Ver output da aplicação

### Environment Variables
1. **Stacks** → **quero-fretes** → **Editor**
2. Modificar seção "Environment variables"
3. **Update the stack**

### Volumes e Backup
```bash
# Backup banco via Console do container
docker exec quero-fretes_postgres_1 pg_dump -U querofretes querofretes_db > backup.sql

# Verificar volumes
docker volume ls | grep quero
```

### Monitoramento
- **Stats**: CPU, RAM, Network via interface
- **Health**: Status dos containers
- **Logs**: Debug de problemas

---

## 🔧 TROUBLESHOOTING

### Container não inicia
1. Verificar **Logs** do container
2. Confirmar environment variables
3. Verificar saúde do PostgreSQL

### Erro de conexão DB
```bash
# Teste conexão via Console postgres
psql -U querofretes -d querofretes_db -c "SELECT 1;"
```

### Rebuild forçado
1. **Stacks** → **quero-fretes**
2. **Stop** → **Remove** → **Deploy**

### Performance
- **Stats** → Monitor uso de recursos
- **Logs** → Procurar por erros de performance

---

## 🎯 RESUMO DO PROCESSO

1. ✅ **Instalar Docker + Portainer** na VPS
2. ✅ **Criar Stack** conectada ao Git
3. ✅ **Configurar variáveis** mínimas obrigatórias
4. ✅ **Deploy** e aguardar build
5. ✅ **Testar** aplicação funcionando
6. ✅ **Adicionar APIs** conforme disponibilidade
7. ✅ **Updates automáticos** via Git

**Tempo total: ~30 minutos para deploy completo**

---

## 📞 SUPORTE

Para problemas específicos:
1. Verificar **Logs** dos containers
2. Confirmar **Environment variables**
3. Testar **conectividade** de rede
4. Verificar **recursos** da VPS (RAM/CPU)

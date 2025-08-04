# 🔒 Segurança Docker - QUERO FRETES

## ⚠️ SOBRE SENHAS NO DOCKER-COMPOSE

**Sua pergunta é muito importante!** As senhas NO devem ficar expostas no docker-compose.yml. Implementei as melhores práticas de segurança:

## ✅ SOLUÇÃO SEGURA IMPLEMENTADA

### 1. Variáveis de Ambiente (.env)
```bash
# As senhas ficam APENAS no arquivo .env (privado)
POSTGRES_PASSWORD=SuaSenhaForteDoDB123!
OPENAI_API_KEY=sk-proj-xxxxxxxxxx
SMTP_PASS=SuaSenhaEmail456!
```

### 2. Docker-Compose Seguro
```yaml
# docker-compose.yml NÃO contém senhas
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Vem do .env
  OPENAI_API_KEY: ${OPENAI_API_KEY}       # Vem do .env
```

## 🛡️ CAMADAS DE SEGURANÇA

### Nível 1: Arquivo .env
- **Localização**: Apenas no servidor
- **Visibilidade**: Somente admin do sistema
- **Git**: Automaticamente ignorado (.gitignore)
- **Permissões**: 600 (só dono lê/escreve)

### Nível 2: Docker Secrets (Produção Avançada)
```yaml
# Para máxima segurança em produção
services:
  postgres:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### Nível 3: Criptografia
```bash
# Senhas podem ser criptografadas
echo "MinhaSenh@123" | openssl enc -aes-256-cbc -salt > senha.enc
```

## 🔧 CONFIGURAÇÃO SEGURA

### 1. Copiar e Configurar .env
```bash
# Copiar template
cp .env.example .env

# Definir permissões restritivas
chmod 600 .env

# Editar com suas credenciais REAIS
nano .env
```

### 2. Verificar Segurança
```bash
# Verificar se .env está no .gitignore
grep ".env" .gitignore

# Verificar permissões
ls -la .env
# Deve mostrar: -rw------- (600)

# Testar se senhas NÃO aparecem nos logs
docker-compose config
```

### 3. Senhas Seguras Recomendadas
```bash
# PostgreSQL (mínimo 16 caracteres)
POSTGRES_PASSWORD=Db$3cur3P@ssw0rd2024!

# JWT Secret (32+ caracteres)
JWT_SECRET=super_secret_jwt_key_with_32_chars_min!

# OpenAI API Key (do painel oficial)
OPENAI_API_KEY=sk-proj-abc123def456...
```

## 🚨 CHECKLIST DE SEGURANÇA

### ✅ Arquivo .env
- [ ] Criado com `cp .env.example .env`
- [ ] Permissões 600: `chmod 600 .env`
- [ ] Senhas fortes (12+ caracteres)
- [ ] Nunca commitado no Git
- [ ] Backup seguro das credenciais

### ✅ Docker-Compose
- [ ] Nenhuma senha hardcoded
- [ ] Usa variáveis: `${POSTGRES_PASSWORD}`
- [ ] Ports internos quando possível
- [ ] Restart policies configuradas

### ✅ Nginx
- [ ] Rate limiting ativo
- [ ] Headers de segurança
- [ ] SSL configurado (produção)
- [ ] Logs de acesso monitorados

### ✅ Banco de Dados
- [ ] Senha forte do PostgreSQL
- [ ] Usuário específico da aplicação
- [ ] Backups criptografados
- [ ] Acesso restrito por IP

## 🔐 PRÁTICAS AVANÇADAS

### 1. Docker Secrets (Produção)
```bash
# Criar secrets
echo "senha_super_secreta" | docker secret create db_password -
echo "chave_openai" | docker secret create openai_key -

# Usar no docker-compose.yml
services:
  app:
    secrets:
      - db_password
      - openai_key
```

### 2. Vault Integration
```bash
# HashiCorp Vault para gerenciar secrets
docker run -d --name=vault \
  -p 8200:8200 \
  vault:latest
```

### 3. Kubernetes Secrets
```yaml
# Para deploy em Kubernetes
apiVersion: v1
kind: Secret
metadata:
  name: quero-fretes-secrets
type: Opaque
data:
  postgres-password: <base64-encoded>
  openai-key: <base64-encoded>
```

## 🚫 O QUE NUNCA FAZER

### ❌ Senhas Expostas
```yaml
# NUNCA FAÇA ISSO:
environment:
  POSTGRES_PASSWORD: minhasenha123  # EXPOSTO!
```

### ❌ Commits Acidentais
```bash
# Sempre verificar antes do commit:
git status
git diff --cached

# Se .env foi commitado por engano:
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### ❌ Logs com Senhas
```bash
# Nunca logar senhas:
echo "Senha: $POSTGRES_PASSWORD"  # PERIGOSO!

# Use apenas:
echo "Banco conectado com sucesso"
```

## 🔄 ROTAÇÃO DE SENHAS

### Plano de Rotação Trimestral
```bash
# 1. Gerar nova senha
NEW_PASS=$(openssl rand -base64 32)

# 2. Atualizar .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$NEW_PASS/" .env

# 3. Restart serviços
docker-compose restart postgres app

# 4. Testar conexão
docker-compose exec app npm run db:health
```

## 📊 MONITORAMENTO

### 1. Logs de Segurança
```bash
# Monitorar tentativas de acesso
docker-compose logs nginx | grep "401\|403\|404"

# Monitorar banco
docker-compose logs postgres | grep "FATAL\|ERROR"
```

### 2. Alertas Automáticos
```bash
# Script de monitoramento
#!/bin/bash
if docker-compose logs postgres | grep -q "authentication failed"; then
    echo "ALERTA: Tentativa de login inválida no banco!" | mail admin@exemplo.com
fi
```

## 📋 COMANDOS ÚTEIS

```bash
# Verificar se há senhas expostas
grep -r "password\|secret\|key" docker-compose.yml

# Testar configuração sem subir
docker-compose config

# Verificar variáveis carregadas
docker-compose exec app env | grep -E "(POSTGRES|OPENAI|SMTP)"

# Backup seguro do .env
cp .env .env.backup.$(date +%Y%m%d)
chmod 600 .env.backup.*
```

---

## ✅ RESUMO

Com essa configuração:
- ✅ Senhas ficam APENAS no arquivo `.env` (privado)
- ✅ Docker-compose é seguro para compartilhar
- ✅ Git ignora automaticamente credenciais
- ✅ Permissões restritivas nos arquivos
- ✅ Criptografia e secrets para produção

**Suas credenciais estão protegidas!** 🛡️
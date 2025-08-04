# 🐳 Instalação do QUERO FRETES com Docker

Este guia explica como instalar e executar o sistema QUERO FRETES usando Docker.

## 📋 Pré-requisitos

- Sistema Linux (Ubuntu 20.04+ recomendado) ou Windows com WSL2
- Mínimo de 4GB RAM
- 10GB de espaço em disco livre
- Conexão com internet

## 🚀 Instalação Rápida

### Opção 1: Script Automático (Recomendado)

```bash
# Clonar o repositório
git clone <seu-repositorio> quero-fretes
cd quero-fretes

# Executar script de instalação
chmod +x docker-setup.sh
./docker-setup.sh auto
```

### Opção 2: Instalação Manual

#### 1. Instalar Docker

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker  # ou faça logout/login
```

#### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` com suas configurações:

```bash
# Copiar exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

**Configurações Obrigatórias:**

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:SuaSenhaSegura123@postgres:5432/quero_fretes
POSTGRES_PASSWORD=SuaSenhaSegura123

# OpenAI (Assistente AI)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu.email@gmail.com
SMTP_PASS=sua_senha_de_app_gmail

# OpenPix (Pagamentos PIX)
OPENPIX_APP_ID=sua_chave_openpix

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### 3. Build e Execução

```bash
# Build da aplicação
docker-compose build

# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

## 🔧 Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs apenas da aplicação
docker-compose logs -f app

# Parar serviços
docker-compose down

# Restart completo
docker-compose down && docker-compose up -d

# Acessar container da aplicação
docker-compose exec app /bin/sh

# Acessar banco de dados
docker-compose exec postgres psql -U postgres -d quero_fretes

# Aplicar migrações do banco
docker-compose exec app npm run db:push
```

## 🌐 Acesso à Aplicação

Após a instalação bem-sucedida:

- **Aplicação**: http://localhost (ou http://localhost:5000 sem nginx)
- **Banco de Dados**: localhost:5432
- **Admin**: Criar usuário admin via script

## 📊 Monitoramento

### Verificar Status dos Serviços

```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Logs de erro
docker-compose logs app | grep ERROR
```

### Health Checks

```bash
# Verificar saúde da aplicação
curl http://localhost/health

# Verificar banco de dados
docker-compose exec postgres pg_isready -U postgres
```

## 🔒 Configurações de Segurança

### 1. Banco de Dados

```bash
# Criar backup
docker-compose exec postgres pg_dump -U postgres quero_fretes > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres quero_fretes < backup.sql
```

### 2. SSL/HTTPS (Produção)

Para ativar HTTPS, edite o arquivo `nginx.conf` e adicione seus certificados SSL:

```bash
# Criar diretório para certificados
mkdir -p ssl

# Copiar certificados
cp seu_certificado.crt ssl/cert.pem
cp sua_chave_privada.key ssl/key.pem

# Descomente as configurações SSL no nginx.conf
# Reinicie os serviços
docker-compose restart nginx
```

## 🚨 Solução de Problemas

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Ver logs do banco
docker-compose logs postgres

# Reiniciar banco
docker-compose restart postgres
```

#### 2. Erro de Build
```bash
# Limpar cache do Docker
docker system prune -a

# Rebuild sem cache
docker-compose build --no-cache
```

#### 3. Porta em Uso
```bash
# Verificar qual processo usa a porta
sudo lsof -i :5000

# Parar container que pode estar rodando
docker stop $(docker ps -q)
```

#### 4. Problemas de Permissão
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Logs Importantes

```bash
# Logs da aplicação
docker-compose logs app

# Logs do banco
docker-compose logs postgres

# Logs do nginx
docker-compose logs nginx

# Todos os logs
docker-compose logs
```

## 📈 Performance

### Configurações de Produção

1. **Aumentar recursos do PostgreSQL** (no `docker-compose.yml`):
```yaml
postgres:
  deploy:
    resources:
      limits:
        memory: 1G
        cpus: '0.5'
```

2. **Configurar backup automático**:
```bash
# Adicionar ao crontab
0 2 * * * docker-compose exec postgres pg_dump -U postgres quero_fretes > /backups/backup_$(date +\%Y\%m\%d).sql
```

## 🔄 Atualizações

```bash
# Parar serviços
docker-compose down

# Atualizar código
git pull origin main

# Rebuild e reiniciar
docker-compose build --no-cache
docker-compose up -d

# Aplicar migrações se necessário
docker-compose exec app npm run db:push
```

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs: `docker-compose logs`
2. Confirme as variáveis de ambiente no `.env`
3. Teste a conectividade: `curl http://localhost/health`
4. Reinicie os serviços: `docker-compose restart`

## 📚 Estrutura dos Arquivos Docker

```
.
├── Dockerfile              # Imagem da aplicação
├── docker-compose.yml      # Orquestração dos serviços
├── .dockerignore           # Arquivos ignorados no build
├── nginx.conf              # Configuração do proxy reverso
├── init-db.sql             # Script de inicialização do banco
├── docker-setup.sh         # Script de instalação automática
└── .env                    # Variáveis de ambiente (criar)
```

---

✅ **Pronto!** Seu sistema QUERO FRETES está rodando em Docker com todas as funcionalidades operacionais.
#!/bin/bash

# ================================
# QUERO FRETES - Script de Deploy VPS
# ================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do QUERO FRETES..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções auxiliares
log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    log_error "Por favor, execute como root (sudo ./vps-deploy.sh)"
    exit 1
fi

# 1. Verificar se Docker está instalado
echo "📦 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    log_warning "Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    log_success "Docker instalado"
else
    log_success "Docker já instalado"
fi

# 2. Verificar Docker Compose
echo "📦 Verificando Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    log_warning "Docker Compose não encontrado. Instalando..."
    apt-get update
    apt-get install -y docker-compose-plugin
    log_success "Docker Compose instalado"
else
    log_success "Docker Compose já instalado"
fi

# 3. Verificar se .env existe
echo "🔐 Verificando arquivo .env..."
if [ ! -f .env ]; then
    log_error "Arquivo .env não encontrado!"
    echo "Por favor, copie .env.example para .env e configure:"
    echo "cp .env.example .env"
    echo "nano .env"
    exit 1
fi
log_success "Arquivo .env encontrado"

# 4. Verificar variáveis essenciais
echo "🔍 Verificando variáveis de ambiente essenciais..."
source .env

required_vars=(
    "POSTGRES_PASSWORD"
    "SESSION_SECRET"
    "OPENAI_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Variável $var não configurada no .env"
        exit 1
    fi
done
log_success "Variáveis essenciais configuradas"

# 5. Parar containers antigos se existirem
echo "🛑 Parando containers antigos..."
docker compose down || true
log_success "Containers antigos parados"

# 6. Build das imagens
echo "🏗️  Fazendo build das imagens..."
docker compose build --no-cache
log_success "Build concluído"

# 7. Iniciar containers
echo "🚀 Iniciando containers..."
docker compose up -d
log_success "Containers iniciados"

# 8. Aguardar PostgreSQL ficar pronto
echo "⏳ Aguardando PostgreSQL inicializar..."
sleep 10

# 9. Executar migrations
echo "📊 Executando migrations do banco de dados..."
docker exec querofretes-app npm run db:push || log_warning "Migrations falharam - verifique manualmente"

# 10. Verificar status dos containers
echo "📋 Status dos containers:"
docker compose ps

# 11. Verificar logs recentes
echo ""
echo "📝 Logs recentes da aplicação:"
docker compose logs --tail=20 app

# 12. Testar health check
echo ""
echo "🏥 Testando health check..."
sleep 5
if curl -f http://localhost/health &> /dev/null; then
    log_success "Health check OK!"
else
    log_warning "Health check falhou - verifique os logs"
fi

# 13. Informações finais
echo ""
echo "================================"
echo "🎉 Deploy concluído com sucesso!"
echo "================================"
echo ""
echo "📊 Comandos úteis:"
echo ""
echo "  Ver logs:"
echo "  docker compose logs -f app"
echo ""
echo "  Reiniciar aplicação:"
echo "  docker compose restart app"
echo ""
echo "  Parar tudo:"
echo "  docker compose down"
echo ""
echo "  Ver status:"
echo "  docker compose ps"
echo ""
echo "  Acessar container:"
echo "  docker exec -it querofretes-app sh"
echo ""
echo "📍 Acesse a aplicação em:"
echo "  http://$(hostname -I | awk '{print $1}')"
echo ""

# 14. Verificar SSL (se domínio configurado)
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "seudominio.com.br" ]; then
    echo "🔒 Para configurar SSL (HTTPS):"
    echo ""
    echo "1. Instale certbot:"
    echo "   apt install certbot -y"
    echo ""
    echo "2. Gere o certificado:"
    echo "   docker compose stop nginx"
    echo "   certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
    echo ""
    echo "3. Copie os certificados:"
    echo "   mkdir -p ssl"
    echo "   cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/"
    echo "   cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/"
    echo ""
    echo "4. Edite nginx.conf e descomente a seção HTTPS"
    echo ""
    echo "5. Reinicie o nginx:"
    echo "   docker compose start nginx"
fi

log_success "Script concluído!"

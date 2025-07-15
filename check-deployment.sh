#!/bin/bash

# Script para verificar status da implantação
# Execute na VPS após a implantação

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "🔍 Verificando status da implantação do QUERO FRETES..."
echo

# Verificar se está no diretório correto
if [[ ! -f "/var/www/querofretes/package.json" ]]; then
    print_error "Projeto não encontrado em /var/www/querofretes/"
    exit 1
fi

cd /var/www/querofretes

# 1. Verificar Node.js
print_header "Node.js"
if command -v node &> /dev/null; then
    node_version=$(node --version)
    print_success "Node.js instalado: $node_version"
else
    print_error "Node.js não encontrado"
fi

# 2. Verificar PostgreSQL
print_header "PostgreSQL"
if systemctl is-active --quiet postgresql; then
    print_success "PostgreSQL está rodando"
    
    # Testar conexão
    if PGPASSWORD=$PGPASSWORD psql -h localhost -U querofretes -d querofretes_db -c "\q" 2>/dev/null; then
        print_success "Conexão com banco de dados OK"
    else
        print_error "Falha na conexão com banco de dados"
    fi
else
    print_error "PostgreSQL não está rodando"
fi

# 3. Verificar PM2
print_header "PM2"
if command -v pm2 &> /dev/null; then
    print_success "PM2 instalado"
    
    # Verificar se aplicação está rodando
    if pm2 describe querofretes &> /dev/null; then
        status=$(pm2 describe querofretes | grep "status" | head -1 | awk '{print $4}')
        if [[ "$status" == "online" ]]; then
            print_success "Aplicação está rodando (status: $status)"
        else
            print_error "Aplicação não está rodando (status: $status)"
        fi
    else
        print_error "Aplicação não encontrada no PM2"
    fi
else
    print_error "PM2 não encontrado"
fi

# 4. Verificar Nginx
print_header "Nginx"
if systemctl is-active --quiet nginx; then
    print_success "Nginx está rodando"
    
    # Testar configuração
    if nginx -t &> /dev/null; then
        print_success "Configuração do Nginx OK"
    else
        print_error "Erro na configuração do Nginx"
    fi
else
    print_error "Nginx não está rodando"
fi

# 5. Verificar arquivos do projeto
print_header "Arquivos do Projeto"
if [[ -f "package.json" ]]; then
    print_success "package.json encontrado"
else
    print_error "package.json não encontrado"
fi

if [[ -d "node_modules" ]]; then
    print_success "node_modules encontrado"
else
    print_error "node_modules não encontrado - execute: npm install"
fi

if [[ -d "dist" ]]; then
    print_success "Build (dist) encontrado"
else
    print_error "Build não encontrado - execute: npm run build"
fi

if [[ -f ".env" ]]; then
    print_success "Arquivo .env encontrado"
else
    print_error "Arquivo .env não encontrado"
fi

# 6. Verificar portas
print_header "Portas"
if netstat -tlnp | grep ":5000" &> /dev/null; then
    print_success "Porta 5000 está sendo usada"
else
    print_error "Porta 5000 não está sendo usada"
fi

if netstat -tlnp | grep ":80" &> /dev/null; then
    print_success "Porta 80 está sendo usada"
else
    print_error "Porta 80 não está sendo usada"
fi

if netstat -tlnp | grep ":443" &> /dev/null; then
    print_success "Porta 443 está sendo usada (HTTPS)"
else
    print_warning "Porta 443 não está sendo usada (HTTPS não configurado)"
fi

# 7. Verificar SSL
print_header "SSL"
if [[ -f "/etc/letsencrypt/live/*/fullchain.pem" ]]; then
    print_success "Certificado SSL encontrado"
else
    print_warning "Certificado SSL não encontrado"
fi

# 8. Verificar logs
print_header "Logs"
if [[ -d "logs" ]]; then
    print_success "Diretório de logs encontrado"
    
    # Verificar se há erros recentes
    if [[ -f "logs/err.log" ]]; then
        error_count=$(tail -n 100 logs/err.log 2>/dev/null | wc -l)
        if [[ $error_count -gt 0 ]]; then
            print_warning "Encontrados $error_count erros recentes no log"
        else
            print_success "Nenhum erro recente encontrado"
        fi
    fi
else
    print_error "Diretório de logs não encontrado"
fi

# 9. Verificar backup
print_header "Backup"
if [[ -f "backup.sh" ]]; then
    print_success "Script de backup encontrado"
else
    print_error "Script de backup não encontrado"
fi

if [[ -d "/var/backups/querofretes" ]]; then
    print_success "Diretório de backup encontrado"
    
    backup_count=$(ls -1 /var/backups/querofretes/ 2>/dev/null | wc -l)
    if [[ $backup_count -gt 0 ]]; then
        print_success "Encontrados $backup_count arquivos de backup"
    else
        print_warning "Nenhum arquivo de backup encontrado"
    fi
else
    print_error "Diretório de backup não encontrado"
fi

# 10. Teste de conectividade
print_header "Teste de Conectividade"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200"; then
    print_success "Aplicação respondendo na porta 5000"
else
    print_error "Aplicação não está respondendo na porta 5000"
fi

# 11. Verificar espaço em disco
print_header "Espaço em Disco"
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [[ $disk_usage -lt 80 ]]; then
    print_success "Espaço em disco OK ($disk_usage% usado)"
else
    print_warning "Espaço em disco baixo ($disk_usage% usado)"
fi

# 12. Verificar memória
print_header "Uso de Memória"
memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [[ $memory_usage -lt 80 ]]; then
    print_success "Uso de memória OK ($memory_usage% usado)"
else
    print_warning "Uso de memória alto ($memory_usage% usado)"
fi

echo
print_header "RESUMO"
echo "Data da verificação: $(date)"
echo "Diretório: $(pwd)"
echo "Usuário: $(whoami)"
echo

print_info "Para mais informações:"
echo "  - Status PM2: pm2 status"
echo "  - Logs aplicação: pm2 logs querofretes"
echo "  - Logs Nginx: sudo tail -f /var/log/nginx/error.log"
echo "  - Logs PostgreSQL: sudo journalctl -u postgresql"
echo "  - Reiniciar aplicação: pm2 restart querofretes"
echo "  - Verificar configuração Nginx: sudo nginx -t"
#!/bin/bash

# QUERO FRETES - Sistema de Versionamento
# Facilita deploy e atualizações via Git + Docker

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="QUERO FRETES"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="backups"

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Verificar se estamos em um repositório Git
check_git() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Este não é um repositório Git. Execute: git init"
    fi
}

# Obter versão atual
get_current_version() {
    if git describe --tags --exact-match HEAD 2>/dev/null; then
        git describe --tags --exact-match HEAD
    else
        echo "development"
    fi
}

# Listar versões disponíveis
list_versions() {
    log "Versões disponíveis:"
    git tag -l --sort=-version:refname | head -10
    echo ""
    log "Versão atual: $(get_current_version)"
    log "Branch atual: $(git branch --show-current)"
}

# Criar nova versão
create_version() {
    local version_type=$1
    local custom_version=$2
    
    check_git
    
    # Verificar se há mudanças não commitadas
    if ! git diff-index --quiet HEAD --; then
        error "Há mudanças não commitadas. Commit primeiro ou use: git stash"
    fi
    
    # Obter última tag
    local last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
    
    if [[ $custom_version ]]; then
        local new_version="v$custom_version"
    else
        # Extrair números da versão
        local version_regex="v([0-9]+)\.([0-9]+)\.([0-9]+)"
        if [[ $last_tag =~ $version_regex ]]; then
            local major=${BASH_REMATCH[1]}
            local minor=${BASH_REMATCH[2]}
            local patch=${BASH_REMATCH[3]}
        else
            local major=0
            local minor=0
            local patch=0
        fi
        
        # Incrementar versão baseado no tipo
        case $version_type in
            "major")
                major=$((major + 1))
                minor=0
                patch=0
                ;;
            "minor")
                minor=$((minor + 1))
                patch=0
                ;;
            "patch"|*)
                patch=$((patch + 1))
                ;;
        esac
        
        local new_version="v$major.$minor.$patch"
    fi
    
    log "Criando versão: $new_version"
    
    # Criar tag anotada
    git tag -a "$new_version" -m "Release $new_version - $(date +'%Y-%m-%d %H:%M:%S')"
    
    log "✅ Versão $new_version criada com sucesso!"
    log "Para fazer push: ./version.sh push"
}

# Push da versão para repositório
push_version() {
    check_git
    
    log "Fazendo push do código e tags..."
    git push origin $(git branch --show-current)
    git push origin --tags
    
    log "✅ Push realizado com sucesso!"
}

# Deploy via Docker
deploy() {
    local version=$1
    
    log "Iniciando deploy do $PROJECT_NAME"
    
    if [[ $version ]]; then
        log "Checkout para versão: $version"
        git checkout $version 2>/dev/null || error "Versão $version não encontrada"
    fi
    
    # Verificar se Docker está rodando
    if ! docker info > /dev/null 2>&1; then
        error "Docker não está rodando"
    fi
    
    # Backup do banco se existir
    if docker ps | grep -q "quero_fretes_db"; then
        log "Fazendo backup do banco de dados..."
        mkdir -p $BACKUP_DIR
        docker exec quero_fretes_db pg_dump -U querofretes querofretes_db > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
        log "✅ Backup salvo em $BACKUP_DIR/"
    fi
    
    # Parar containers existentes
    if [[ -f $DOCKER_COMPOSE_FILE ]]; then
        log "Parando containers existentes..."
        docker-compose down
    fi
    
    # Rebuild e start
    log "Fazendo build e iniciando containers..."
    docker-compose up -d --build
    
    # Aguardar containers iniciarem
    log "Aguardando containers iniciarem..."
    sleep 10
    
    # Verificar status
    if docker-compose ps | grep -q "Up"; then
        log "✅ Deploy realizado com sucesso!"
        log "Aplicação disponível em: http://localhost:5000"
        
        # Mostrar status dos containers
        echo ""
        log "Status dos containers:"
        docker-compose ps
    else
        error "Falha no deploy. Verifique os logs: docker-compose logs"
    fi
}

# Rollback para versão anterior
rollback() {
    local target_version=$1
    
    if [[ ! $target_version ]]; then
        warn "Nenhuma versão especificada. Mostrando versões disponíveis:"
        list_versions
        echo ""
        read -p "Digite a versão para rollback (ex: v1.0.0): " target_version
    fi
    
    if [[ ! $target_version ]]; then
        error "Versão é obrigatória para rollback"
    fi
    
    log "Fazendo rollback para versão: $target_version"
    
    # Verificar se a versão existe
    if ! git tag -l | grep -q "^$target_version$"; then
        error "Versão $target_version não encontrada"
    fi
    
    # Backup antes do rollback
    if docker ps | grep -q "quero_fretes_db"; then
        log "Fazendo backup antes do rollback..."
        mkdir -p $BACKUP_DIR
        docker exec quero_fretes_db pg_dump -U querofretes querofretes_db > "$BACKUP_DIR/pre_rollback_$(date +%Y%m%d_%H%M%S).sql"
    fi
    
    # Fazer checkout e deploy
    git checkout $target_version
    deploy
    
    log "✅ Rollback para $target_version concluído!"
}

# Mostrar logs da aplicação
show_logs() {
    local service=$1
    
    if [[ ! -f $DOCKER_COMPOSE_FILE ]]; then
        error "docker-compose.yml não encontrado"
    fi
    
    if [[ $service ]]; then
        log "Logs do serviço: $service"
        docker-compose logs -f $service
    else
        log "Logs de todos os serviços:"
        docker-compose logs -f
    fi
}

# Verificar status da aplicação
status() {
    log "Status do $PROJECT_NAME"
    echo ""
    
    # Versão atual
    log "Versão: $(get_current_version)"
    log "Branch: $(git branch --show-current)"
    log "Último commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
    echo ""
    
    # Status Docker
    if docker info > /dev/null 2>&1; then
        if [[ -f $DOCKER_COMPOSE_FILE ]]; then
            log "Containers:"
            docker-compose ps
            echo ""
            
            # Testar aplicação
            if curl -s http://localhost:5000/api/health > /dev/null; then
                log "✅ Aplicação respondendo em http://localhost:5000"
            else
                warn "❌ Aplicação não está respondendo"
            fi
        else
            warn "docker-compose.yml não encontrado"
        fi
    else
        warn "Docker não está rodando"
    fi
}

# Atualizar para última versão
update() {
    log "Atualizando $PROJECT_NAME para última versão..."
    
    check_git
    
    # Fetch das atualizações
    git fetch origin --tags
    
    # Obter última tag
    local latest_tag=$(git describe --tags `git rev-list --tags --max-count=1` 2>/dev/null)
    
    if [[ $latest_tag ]]; then
        log "Última versão disponível: $latest_tag"
        log "Versão atual: $(get_current_version)"
        
        if [[ "$(get_current_version)" != "$latest_tag" ]]; then
            read -p "Atualizar para $latest_tag? (y/N): " confirm
            if [[ $confirm == [yY] ]]; then
                deploy $latest_tag
            else
                log "Atualização cancelada"
            fi
        else
            log "✅ Já está na versão mais recente"
        fi
    else
        warn "Nenhuma versão taggeada encontrada"
    fi
}

# Menu de ajuda
show_help() {
    echo -e "${BLUE}$PROJECT_NAME - Sistema de Versionamento${NC}"
    echo ""
    echo "Uso: ./version.sh [comando] [argumentos]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  list                     Lista versões disponíveis"
    echo "  create [patch|minor|major|X.Y.Z]  Cria nova versão"
    echo "  push                     Faz push do código e tags"
    echo "  deploy [versão]          Deploy via Docker"
    echo "  rollback [versão]        Rollback para versão específica"
    echo "  update                   Atualiza para última versão"
    echo "  status                   Mostra status atual"
    echo "  logs [serviço]           Mostra logs da aplicação"
    echo "  help                     Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  ./version.sh create patch     # v1.0.1 → v1.0.2"
    echo "  ./version.sh create minor     # v1.0.2 → v1.1.0"  
    echo "  ./version.sh create major     # v1.1.0 → v2.0.0"
    echo "  ./version.sh create 2.1.5     # Versão customizada"
    echo "  ./version.sh deploy v1.0.0    # Deploy versão específica"
    echo "  ./version.sh rollback v1.0.0  # Voltar para v1.0.0"
    echo "  ./version.sh logs app         # Logs do container app"
}

# Comando principal
case ${1:-help} in
    "list")
        list_versions
        ;;
    "create")
        create_version $2 $3
        ;;
    "push")
        push_version
        ;;
    "deploy")
        deploy $2
        ;;
    "rollback")
        rollback $2
        ;;
    "update")
        update
        ;;
    "status")
        status
        ;;
    "logs")
        show_logs $2
        ;;
    "help"|*)
        show_help
        ;;
esac
#!/bin/bash

# Script de configuração e instalação do Docker para QUERO FRETES
# Execute este script para configurar todo o ambiente Docker

set -e

echo "🚀 Configurando QUERO FRETES com Docker..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instalando Docker..."
    
    # Atualizar repositórios
    sudo apt-get update
    
    # Instalar dependências
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Adicionar chave GPG oficial do Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Adicionar repositório do Docker
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Instalar Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Adicionar usuário ao grupo docker
    sudo usermod -aG docker $USER
    
    echo "✅ Docker instalado com sucesso!"
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instalando..."
    
    # Baixar Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Dar permissão de execução
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "✅ Docker Compose instalado com sucesso!"
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
# Configurações do Banco de Dados
DATABASE_URL=postgresql://postgres:sua_senha_aqui@localhost:5432/quero_fretes
POSTGRES_PASSWORD=sua_senha_aqui

# Configurações da Aplicação
NODE_ENV=production
PORT=5000

# Chaves da API (Configure com suas chaves reais)
OPENAI_API_KEY=sua_chave_openai_aqui
VITE_GA_MEASUREMENT_ID=sua_chave_ga_aqui

# Configurações de Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app_gmail

# OpenPix (Pagamentos)
OPENPIX_APP_ID=sua_chave_openpix_aqui

# N8N Webhooks (Opcional)
N8N_WEBHOOK_URL=sua_url_n8n_aqui

# Outros serviços
RECEITA_WS_API_URL=https://www.receitaws.com.br/v1
IBGE_API_URL=https://servicodados.ibge.gov.br/api/v1
EOF
    echo "✅ Arquivo .env criado. IMPORTANTE: Edite o arquivo .env com suas configurações reais!"
fi

# Criar diretórios necessários
echo "📁 Criando diretórios necessários..."
mkdir -p logs
mkdir -p ssl

# Função para configurar variáveis de ambiente
configure_env() {
    echo ""
    echo "🔧 CONFIGURAÇÃO OBRIGATÓRIA:"
    echo "Antes de continuar, você DEVE editar o arquivo .env com suas configurações:"
    echo ""
    echo "1. DATABASE_URL - String de conexão com o banco"
    echo "2. OPENAI_API_KEY - Chave da API OpenAI (para assistente AI)"
    echo "3. SMTP_* - Configurações do seu provedor de email"
    echo "4. OPENPIX_APP_ID - Chave da OpenPix (pagamentos)"
    echo "5. VITE_GA_MEASUREMENT_ID - ID do Google Analytics"
    echo ""
    read -p "Deseja editar o arquivo .env agora? (y/n): " edit_env
    
    if [ "$edit_env" = "y" ] || [ "$edit_env" = "Y" ]; then
        ${EDITOR:-nano} .env
    fi
}

# Build da aplicação
build_app() {
    echo "🔨 Fazendo build da aplicação..."
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        echo "✅ Build concluído com sucesso!"
    else
        echo "❌ Erro durante o build. Verifique as configurações."
        exit 1
    fi
}

# Iniciar serviços
start_services() {
    echo "🚀 Iniciando serviços..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo "✅ Serviços iniciados com sucesso!"
        echo ""
        echo "📱 Aplicação disponível em: http://localhost"
        echo "🗄️  Banco de dados: localhost:5432"
        echo ""
        echo "Para ver os logs: docker-compose logs -f"
        echo "Para parar: docker-compose down"
    else
        echo "❌ Erro ao iniciar serviços."
        exit 1
    fi
}

# Menu principal
main_menu() {
    echo ""
    echo "🐳 QUERO FRETES - Docker Setup"
    echo "=============================="
    echo "1. Configurar variáveis de ambiente"
    echo "2. Build da aplicação"
    echo "3. Iniciar serviços"
    echo "4. Parar serviços"
    echo "5. Ver logs"
    echo "6. Restart completo"
    echo "7. Sair"
    echo ""
    read -p "Escolha uma opção (1-7): " choice
    
    case $choice in
        1) configure_env ;;
        2) build_app ;;
        3) start_services ;;
        4) echo "🛑 Parando serviços..."; docker-compose down ;;
        5) docker-compose logs -f ;;
        6) 
            echo "🔄 Reiniciando completamente..."
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
            ;;
        7) echo "👋 Saindo..."; exit 0 ;;
        *) echo "❌ Opção inválida"; main_menu ;;
    esac
}

# Verificar se é primeira execução
if [ "$1" = "auto" ]; then
    configure_env
    build_app
    start_services
else
    main_menu
fi

echo ""
echo "✨ Setup concluído! Aplicação rodando em Docker."
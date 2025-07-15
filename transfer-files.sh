#!/bin/bash

# Script para transferir arquivos para a VPS
# Execute no seu computador local (na pasta do projeto)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está na pasta do projeto
if [[ ! -f "package.json" ]]; then
    print_error "Execute este script na pasta raiz do projeto (onde está o package.json)"
    exit 1
fi

# Solicitar informações da VPS
read -p "Digite o IP da sua VPS: " vps_ip
read -p "Digite o usuário da VPS: " vps_user

print_status "Transferindo arquivos para $vps_user@$vps_ip:/var/www/querofretes/"

# Criar arquivo .rsyncignore para excluir arquivos desnecessários
cat > .rsyncignore << 'EOF'
node_modules/
dist/
.git/
*.log
.env
.env.local
.env.production
.replit
replit.nix
cookies.txt
attached_assets/
temp-snippet.tsx
vehicle-types-component.txt
.gitignore
EOF

# Sincronizar arquivos usando rsync
rsync -avz --progress --exclude-from=.rsyncignore . $vps_user@$vps_ip:/var/www/querofretes/

# Remover arquivo temporário
rm .rsyncignore

print_status "✅ Arquivos transferidos com sucesso!"
print_warning "PRÓXIMOS PASSOS NA VPS:"
echo "1. Conecte-se à VPS: ssh $vps_user@$vps_ip"
echo "2. Navegue até o projeto: cd /var/www/querofretes"
echo "3. Instale dependências: npm install"
echo "4. Execute o build: npm run build"
echo "5. Configure o banco: npm run db:push"
echo "6. Inicie a aplicação: pm2 start ecosystem.config.js"
echo "7. Salve configuração PM2: pm2 save"
echo "8. Configure auto-start: pm2 startup"
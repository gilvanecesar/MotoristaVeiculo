#!/bin/bash

# QUERO FRETES - Comandos de Deploy Rápido

# ===== VERSIONAMENTO =====

# Criar versões
./version.sh create patch    # v1.0.1 → v1.0.2
./version.sh create minor    # v1.0.2 → v1.1.0  
./version.sh create major    # v1.1.0 → v2.0.0
./version.sh create 2.1.5    # Versão customizada

# Ver versões
./version.sh list
./version.sh status

# Push para Git
./version.sh push

# ===== DEPLOY =====

# Deploy atual
./version.sh deploy

# Deploy versão específica
./version.sh deploy v1.0.0

# Atualizar para última versão
./version.sh update

# Rollback
./version.sh rollback v1.0.0

# ===== DOCKER DIRETO =====

# Build e start
docker-compose up -d --build

# Parar tudo
docker-compose down

# Logs
docker-compose logs -f
docker-compose logs -f app

# Status
docker-compose ps

# ===== GIT WORKFLOW =====

# Commit rápido
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Tag manual
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin --tags

# ===== BACKUP =====

# Backup banco
docker exec quero_fretes_db pg_dump -U querofretes querofretes_db > backup_$(date +%Y%m%d).sql

# ===== MONITORAMENTO =====

# Testar aplicação
curl http://localhost:5000/api/health
curl http://localhost:5000/api/public/stats

# Ver recursos
docker stats

# Limpar Docker
docker system prune -f
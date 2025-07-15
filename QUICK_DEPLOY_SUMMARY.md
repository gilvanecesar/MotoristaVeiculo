# 🚀 Implantação Rápida - QUERO FRETES

## Resumo dos Passos

### 1️⃣ Na VPS (Configure o servidor)
```bash
# Baixe e execute o script de configuração
wget https://raw.githubusercontent.com/seu-repo/querofretes/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 2️⃣ No seu computador (Transfira os arquivos)
```bash
# Na pasta do projeto
chmod +x transfer-files.sh
./transfer-files.sh
```

### 3️⃣ De volta na VPS (Finalize a configuração)
```bash
cd /var/www/querofretes

# Edite o arquivo .env com suas credenciais
nano .env

# Instale dependências e faça o build
npm install
npm run build
npm run db:push

# Crie o usuário administrador
node create-admin.js

# Inicie a aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure SSL (substitua pelo seu domínio)
sudo certbot --nginx -d seu-dominio.com
```

### 4️⃣ Verificação Final
```bash
# Verifique se está tudo funcionando
chmod +x check-deployment.sh
./check-deployment.sh
```

## 📋 Informações Importantes

### Credenciais do Administrador
- **Email**: admin@querofretes.com
- **Senha**: admin123
- **Email**: gilvane.cesar@gmail.com
- **Senha**: admin123

### Portas Utilizadas
- **5000**: Aplicação Node.js
- **80**: HTTP (Nginx)
- **443**: HTTPS (Nginx + SSL)
- **5432**: PostgreSQL

### Arquivos Importantes
- `/var/www/querofretes/.env` - Configurações
- `/var/www/querofretes/logs/` - Logs da aplicação
- `/var/backups/querofretes/` - Backups automáticos

### Comandos Úteis
```bash
# Status da aplicação
pm2 status

# Logs em tempo real
pm2 logs querofretes

# Reiniciar aplicação
pm2 restart querofretes

# Backup manual
./backup.sh

# Verificar configuração Nginx
sudo nginx -t

# Verificar status PostgreSQL
sudo systemctl status postgresql
```

## 🔧 Configurações Necessárias no .env

```env
# Banco de dados (configurado automaticamente)
DATABASE_URL="postgresql://querofretes:SUA_SENHA@localhost:5432/querofretes_db"

# OpenPix - CONFIGURE COM SUAS CREDENCIAIS
OPENPIX_APP_ID=seu_app_id_openpix
OPENPIX_API_KEY=sua_chave_api_openpix

# Email - CONFIGURE COM SUAS CREDENCIAIS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# URLs - CONFIGURE COM SEU DOMÍNIO
FRONTEND_URL=https://seu-dominio.com
BACKEND_URL=https://seu-dominio.com

# N8N Webhook - CONFIGURE SE USAR
N8N_WEBHOOK_URL=https://hooks.n8n.cloud/webhook/seu_webhook
```

## 🆘 Solução de Problemas

### Aplicação não inicia
```bash
pm2 logs querofretes
# Verifique logs e corrija erros no .env
```

### Banco de dados não conecta
```bash
sudo systemctl status postgresql
psql -h localhost -U querofretes -d querofretes_db
```

### Nginx não funciona
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### SSL não funciona
```bash
sudo certbot --nginx -d seu-dominio.com
```

## 📞 Suporte

Para problemas na implantação, execute:
```bash
./check-deployment.sh
```

Este script mostrará o status detalhado de todos os componentes.

---

**✅ Após seguir estes passos, sua aplicação estará rodando em https://seu-dominio.com**
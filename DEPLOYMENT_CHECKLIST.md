# ✅ Checklist de Implantação - QUERO FRETES

## 📋 Pré-Implantação (No seu computador)

### 1. Preparação dos Arquivos
- [ ] Todos os arquivos do projeto estão funcionando localmente
- [ ] Variáveis de ambiente estão configuradas corretamente
- [ ] Banco de dados local está funcionando
- [ ] Testes básicos foram realizados

### 2. Informações Necessárias para VPS
- [ ] IP da VPS: `_______________`
- [ ] Usuário da VPS: `_______________`
- [ ] Domínio: `_______________`
- [ ] Chave SSH configurada
- [ ] Credenciais OpenPix: `_______________`
- [ ] Credenciais de email (SMTP): `_______________`

## 🖥️ Configuração da VPS

### 3. Configuração Inicial
- [ ] Conectar na VPS via SSH
- [ ] Executar script de implantação: `chmod +x deploy.sh && ./deploy.sh`
- [ ] Confirmar instalação do Node.js (versão 20.x)
- [ ] Confirmar instalação do PostgreSQL
- [ ] Confirmar instalação do PM2
- [ ] Configurar senha do banco de dados

### 4. Transferência de Arquivos
- [ ] Executar script de transferência: `chmod +x transfer-files.sh && ./transfer-files.sh`
- [ ] Confirmar que todos os arquivos foram transferidos
- [ ] Verificar permissões dos arquivos: `sudo chown -R $USER:$USER /var/www/querofretes`

### 5. Configuração do Ambiente
- [ ] Editar arquivo `.env` com credenciais reais:
  ```bash
  nano /var/www/querofretes/.env
  ```
- [ ] Configurar `DATABASE_URL` com senha real
- [ ] Configurar `OPENPIX_API_KEY` com chave real
- [ ] Configurar `SMTP_*` com credenciais reais
- [ ] Configurar `FRONTEND_URL` e `BACKEND_URL` com domínio real

### 6. Instalação e Build
- [ ] Navegar para pasta do projeto: `cd /var/www/querofretes`
- [ ] Instalar dependências: `npm install`
- [ ] Executar build: `npm run build`
- [ ] Verificar se pasta `dist` foi criada
- [ ] Configurar banco de dados: `npm run db:push`

### 7. Configuração do Banco
- [ ] Testar conexão com banco: `psql -h localhost -U querofretes -d querofretes_db`
- [ ] Verificar se tabelas foram criadas
- [ ] Criar usuário administrador (script fornecido no guia)
- [ ] Testar login administrativo

## 🚀 Inicialização da Aplicação

### 8. PM2 e Processo
- [ ] Iniciar aplicação: `pm2 start ecosystem.config.js`
- [ ] Verificar status: `pm2 status`
- [ ] Verificar logs: `pm2 logs querofretes`
- [ ] Salvar configuração: `pm2 save`
- [ ] Configurar auto-start: `pm2 startup`

### 9. Nginx e SSL
- [ ] Verificar configuração do Nginx: `sudo nginx -t`
- [ ] Recarregar Nginx: `sudo systemctl reload nginx`
- [ ] Testar acesso HTTP: `curl http://localhost:5000`
- [ ] Testar acesso via domínio: `curl http://seu-dominio.com`
- [ ] Configurar SSL: `sudo certbot --nginx -d seu-dominio.com`

## 🔧 Testes e Verificações

### 10. Testes Funcionais
- [ ] Acessar aplicação via browser
- [ ] Testar página inicial
- [ ] Testar cadastro de usuário
- [ ] Testar login
- [ ] Testar criação de frete
- [ ] Testar sistema de pagamento (OpenPix)
- [ ] Testar email (se configurado)

### 11. Testes de Performance
- [ ] Verificar tempo de resposta
- [ ] Verificar uso de memória: `htop`
- [ ] Verificar logs de erro: `pm2 logs querofretes --err`
- [ ] Testar sob carga (opcional)

## 🔐 Segurança e Backup

### 12. Configurações de Segurança
- [ ] Configurar firewall: `sudo ufw status`
- [ ] Desabilitar login root SSH
- [ ] Configurar fail2ban (opcional)
- [ ] Verificar permissões de arquivos

### 13. Backup
- [ ] Testar script de backup: `./backup.sh`
- [ ] Verificar cron job: `crontab -l`
- [ ] Confirmar backup em `/var/backups/querofretes`

## 📊 Monitoramento

### 14. Configuração de Monitoramento
- [ ] Configurar PM2 Plus (opcional)
- [ ] Configurar logrotate
- [ ] Verificar logs do sistema: `sudo journalctl -u nginx`
- [ ] Configurar alertas (opcional)

## 🎯 Pós-Implantação

### 15. Documentação
- [ ] Documentar credenciais em local seguro
- [ ] Documentar URLs de acesso
- [ ] Documentar procedimentos de manutenção
- [ ] Criar manual de usuário (se necessário)

### 16. Treinamento
- [ ] Treinar usuários administrativos
- [ ] Treinar usuários finais
- [ ] Documentar processos de negócio

## 📱 Comandos Úteis para Manutenção

### Verificar Status
```bash
pm2 status
pm2 logs querofretes
sudo systemctl status nginx
sudo systemctl status postgresql
```

### Reiniciar Serviços
```bash
pm2 restart querofretes
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

### Atualizar Aplicação
```bash
cd /var/www/querofretes
git pull origin main  # ou como você faz deploy
npm install
npm run build
pm2 reload querofretes
```

### Backup Manual
```bash
cd /var/www/querofretes
./backup.sh
```

## 🆘 Troubleshooting

### Se a aplicação não iniciar:
1. Verificar logs: `pm2 logs querofretes`
2. Verificar .env: `cat /var/www/querofretes/.env`
3. Verificar banco: `sudo systemctl status postgresql`
4. Verificar build: `ls -la /var/www/querofretes/dist/`

### Se houver erro de conexão:
1. Verificar firewall: `sudo ufw status`
2. Verificar Nginx: `sudo nginx -t`
3. Verificar processo: `pm2 status`
4. Verificar porta: `netstat -tlnp | grep 5000`

### Se houver erro de banco:
1. Verificar conexão: `psql -h localhost -U querofretes -d querofretes_db`
2. Verificar tabelas: `\dt` (dentro do psql)
3. Verificar logs: `sudo journalctl -u postgresql`

## 📞 Contatos de Suporte

- **Desenvolvedor**: [Seus contatos]
- **Suporte OpenPix**: [Contato OpenPix]
- **Suporte VPS**: [Contato do provedor]

---

**✅ Implantação concluída com sucesso!**

Data: ___________
Responsável: ___________
Domínio: ___________
Status: ___________
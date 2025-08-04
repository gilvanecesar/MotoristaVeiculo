-- Script de inicialização do banco de dados PostgreSQL para QUERO FRETES
-- Este arquivo será executado automaticamente quando o container PostgreSQL for criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verificar se o usuário da aplicação existe, senão criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'quero_fretes_user') THEN
        CREATE ROLE quero_fretes_user WITH LOGIN PASSWORD 'app_password_123';
    END IF;
END
$$;

-- Conceder privilégios ao usuário da aplicação
GRANT ALL PRIVILEGES ON DATABASE quero_fretes TO quero_fretes_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO quero_fretes_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO quero_fretes_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO quero_fretes_user;

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Recarregar configurações
SELECT pg_reload_conf();
-- Adiciona campo userId na tabela vehicles para vincular veículos ao usuário
ALTER TABLE vehicles ADD COLUMN user_id INTEGER;

-- Adiciona campos que estavam faltando
ALTER TABLE vehicles ADD COLUMN chassi TEXT;
ALTER TABLE vehicles ADD COLUMN capacity TEXT;
ALTER TABLE vehicles ADD COLUMN observations TEXT;

-- Para veículos existentes, vamos definir um valor padrão temporário
-- Em produção, você deve definir manualmente o user_id correto para cada veículo
UPDATE vehicles SET user_id = 1 WHERE user_id IS NULL;

-- Agora torna o campo user_id obrigatório
ALTER TABLE vehicles ALTER COLUMN user_id SET NOT NULL;

-- Adiciona referência foreign key
ALTER TABLE vehicles ADD CONSTRAINT vehicles_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
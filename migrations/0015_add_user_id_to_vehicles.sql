-- Adiciona campo userId na tabela vehicles para vincular veículos ao usuário
ALTER TABLE vehicles ADD COLUMN user_id INTEGER;

-- Adiciona referência foreign key
ALTER TABLE vehicles ADD CONSTRAINT vehicles_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id);

-- Adiciona campos que estavam faltando
ALTER TABLE vehicles ADD COLUMN chassi TEXT;
ALTER TABLE vehicles ADD COLUMN capacity TEXT;
ALTER TABLE vehicles ADD COLUMN observations TEXT;

-- Atualiza veículos existentes para vincular ao usuário através do motorista
UPDATE vehicles 
SET user_id = (
  SELECT d.user_id 
  FROM drivers d 
  WHERE d.id = vehicles.driver_id
)
WHERE user_id IS NULL;

-- Torna o campo user_id obrigatório após a atualização
ALTER TABLE vehicles ALTER COLUMN user_id SET NOT NULL;
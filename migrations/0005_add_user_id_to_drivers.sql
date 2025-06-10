-- Adicionar campo user_id à tabela drivers
ALTER TABLE drivers ADD COLUMN user_id INTEGER;

-- Adicionar foreign key constraint
ALTER TABLE drivers ADD CONSTRAINT drivers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Atualizar motoristas existentes para ter o user_id baseado nos veículos
UPDATE drivers 
SET user_id = (
  SELECT DISTINCT v.user_id 
  FROM vehicles v 
  WHERE v.driver_id = drivers.id 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Para motoristas sem veículos, definir user_id como 1 (admin padrão)
UPDATE drivers 
SET user_id = 1 
WHERE user_id IS NULL;

-- Tornar o campo obrigatório após preencher os dados
ALTER TABLE drivers ALTER COLUMN user_id SET NOT NULL;
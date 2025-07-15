const { Pool } = require('pg');
const { scrypt } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = 'querofretes-salt-2024';
  const buf = await scryptAsync(password, salt, 64);
  return buf.toString('hex');
}

async function createAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔐 Criando usuário administrador...');
    
    const hashedPassword = await hashPassword('admin123');
    
    const result = await pool.query(`
      INSERT INTO users (
        email, 
        password, 
        name, 
        profile_type, 
        auth_provider, 
        is_verified, 
        is_active, 
        subscription_active, 
        subscription_type, 
        subscription_expires_at,
        created_at,
        last_login
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (email) DO UPDATE SET
        password = $2,
        name = $3,
        profile_type = $4,
        is_verified = $6,
        is_active = $7,
        subscription_active = $8,
        subscription_type = $9,
        subscription_expires_at = $10
      RETURNING id, email, name, profile_type
    `, [
      'admin@querofretes.com',
      hashedPassword,
      'Administrador do Sistema',
      'administrador',
      'local',
      true,
      true,
      true,
      'unlimited',
      '2030-12-31T23:59:59Z',
      new Date(),
      new Date()
    ]);

    console.log('✅ Usuário administrador criado/atualizado com sucesso:');
    console.log('   Email: admin@querofretes.com');
    console.log('   Senha: admin123');
    console.log('   Tipo: administrador');
    console.log('   ID:', result.rows[0].id);
    
    // Criar também o usuário Gilvane se especificado
    const gilvaneResult = await pool.query(`
      INSERT INTO users (
        email, 
        password, 
        name, 
        profile_type, 
        auth_provider, 
        is_verified, 
        is_active, 
        subscription_active, 
        subscription_type, 
        subscription_expires_at,
        created_at,
        last_login
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (email) DO UPDATE SET
        password = $2,
        profile_type = $4,
        is_verified = $6,
        is_active = $7,
        subscription_active = $8,
        subscription_type = $9,
        subscription_expires_at = $10
      RETURNING id, email, name, profile_type
    `, [
      'gilvane.cesar@gmail.com',
      hashedPassword,
      'Gilvane Cesar',
      'administrador',
      'local',
      true,
      true,
      true,
      'unlimited',
      '2030-12-31T23:59:59Z',
      new Date(),
      new Date()
    ]);

    console.log('✅ Usuário Gilvane criado/atualizado com sucesso:');
    console.log('   Email: gilvane.cesar@gmail.com');
    console.log('   Senha: admin123');
    console.log('   Tipo: administrador');
    console.log('   ID:', gilvaneResult.rows[0].id);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
  } finally {
    await pool.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
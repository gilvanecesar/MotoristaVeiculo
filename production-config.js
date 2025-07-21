// Configuração otimizada para produção com alta concorrência
const productionPoolConfig = {
  // Para 100+ usuários simultâneos
  max: 50,                    // Máximo 50 conexões DB
  min: 10,                    // Mínimo 10 conexões sempre ativas
  idle: 30000,               // 30s timeout idle
  acquire: 60000,            // 60s timeout para conseguir conexão
  evict: 1000,               // Verificar conexões ociosas a cada 1s
  
  // Para 500+ usuários simultâneos
  // max: 100,
  // min: 20,
  // idle: 10000,
  // acquire: 30000,
  // evict: 500,
};

// Configuração de sessão para alta concorrência
const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  },
  // Para produção com muitos usuários:
  store: new (require('connect-pg-simple')(session))({
    pool: dbPool,
    tableName: 'user_sessions'
  })
};

// Configuração do servidor Express para alta performance
const serverConfig = {
  // Cluster mode para usar todos os cores da CPU
  cluster: true,
  workers: require('os').cpus().length,
  
  // Configurações de timeout
  keepAliveTimeout: 65000,
  headersTimeout: 66000,
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000 // máximo 1000 requests por IP por janela
  }
};

module.exports = {
  productionPoolConfig,
  sessionConfig,
  serverConfig
};
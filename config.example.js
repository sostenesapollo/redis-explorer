// Redis Explorer - Configuração de Exemplo
// Copie este arquivo para config.js e configure suas variáveis

module.exports = {
  // URL padrão do Redis (opcional)
  defaultRedisUrl: 'redis://localhost:6379',
  
  // Configurações da aplicação
  app: {
    name: 'Redis Explorer',
    version: '1.0.0',
    description: 'Gerenciador moderno para Redis'
  },
  
  // Configurações de desenvolvimento
  development: {
    port: 3000,
    host: 'localhost'
  }
};

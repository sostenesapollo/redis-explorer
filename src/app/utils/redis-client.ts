import { createClient, RedisClientType } from 'redis';

export interface RedisConnectionConfig {
  url: string;
  timeout?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

export function createRedisClient(config: RedisConnectionConfig): RedisClientType {
  const {
    url,
    timeout = 10000, // 10 segundos
    retryDelayOnFailover = 100,
    maxRetriesPerRequest = 3,
    enableReadyCheck = true,
    lazyConnect = false
  } = config;

  // Validar URL
  if (!url || !isValidRedisUrl(url)) {
    throw new Error('URL do Redis inválida');
  }

  console.log('Creating Redis client with URL:', url.replace(/\/\/.*@/, '//***@')); // Log sem senha

  const client = createClient({
    url,
    socket: {
      connectTimeout: timeout,
      commandTimeout: timeout,
      reconnectStrategy: (retries) => {
        if (retries > maxRetriesPerRequest) {
          return new Error('Máximo de tentativas de reconexão atingido');
        }
        return Math.min(retries * 50, 1000);
      }
    },
    retryDelayOnFailover,
    maxRetriesPerRequest,
    enableReadyCheck,
    lazyConnect
  });

  // Configurar handlers de erro
  client.on('error', (err) => {
    console.error('Redis Client Error:', {
      message: err.message,
      code: (err as any).code,
      errno: (err as any).errno,
      syscall: (err as any).syscall,
      address: (err as any).address,
      port: (err as any).port,
      timestamp: new Date().toISOString()
    });
  });

  client.on('connect', () => {
    console.log('Redis Client: Conectando...');
  });

  client.on('ready', () => {
    console.log('Redis Client: Conectado e pronto');
  });

  client.on('reconnecting', () => {
    console.log('Redis Client: Reconectando...');
  });

  client.on('end', () => {
    console.log('Redis Client: Conexão encerrada');
  });

  return client;
}

export function isValidRedisUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'redis:' || urlObj.protocol === 'rediss:';
  } catch {
    return false;
  }
}

export async function testRedisConnection(client: RedisClientType): Promise<{ success: boolean; error?: string; debugInfo?: any }> {
  try {
    await client.connect();
    console.log('Connected to Redis, testing commands...');
    
    // Testar ping
    const pingResult = await client.ping();
    console.log('Ping result:', pingResult);
    
    // Testar comando básico
    let serverInfo = null;
    try {
      serverInfo = await client.info('server');
      console.log('Server info retrieved:', serverInfo ? 'Yes' : 'No');
    } catch (infoError: any) {
      console.error('Failed to get server info:', infoError.message);
    }
    
    // Testar permissões básicas
    let keysCount = 0;
    let keysError = null;
    try {
      const keys = await client.keys('*');
      keysCount = keys.length;
      console.log('Keys found:', keysCount);
    } catch (keysErr: any) {
      keysError = keysErr.message;
      console.error('Failed to list keys:', keysErr.message);
    }
    
    // Testar comando SET/GET para verificar permissões de escrita
    let writeTest = false;
    let writeError = null;
    try {
      await client.set('test:connection', 'test');
      const testValue = await client.get('test:connection');
      await client.del('test:connection');
      writeTest = testValue === 'test';
      console.log('Write test successful:', writeTest);
    } catch (writeErr: any) {
      writeError = writeErr.message;
      console.error('Write test failed:', writeErr.message);
    }
    
    return { 
      success: true, 
      debugInfo: {
        pingResult,
        keysCount,
        keysError,
        writeTest,
        writeError,
        serverInfo: serverInfo ? 'Available' : 'Not available'
      }
    };
  } catch (error: any) {
    console.error('Connection test failed:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido na conexão',
      debugInfo: {
        errorType: error.constructor.name,
        errorCode: (error as any).code,
        errorErrno: (error as any).errno
      }
    };
  }
}

export async function safeDisconnect(client: RedisClientType): Promise<void> {
  try {
    if (client.isOpen) {
      await client.disconnect();
    }
  } catch (error) {
    console.warn('Erro ao desconectar cliente Redis:', error);
  }
}

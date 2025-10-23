import { NextRequest, NextResponse } from 'next/server';
import { createRedisClient, safeDisconnect } from '../../../utils/redis-client';

export async function GET(request: NextRequest) {
  let   client;
  
  try {
    console.log('Starting logs request');
    
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL do Redis é obrigatória' }, { status: 400 });
    }

    // Criar cliente com timeout mais agressivo para logs
    client = createRedisClient({ 
      url,
      timeout: 5000, // 5 segundos para logs
      maxRetriesPerRequest: 1 // Menos tentativas para logs
    });
    
    // Implementar timeout manual para toda a operação
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Operação demorou mais de 8 segundos')), 8000);
    });
    
    const operationPromise = (async () => {
      console.log('Connecting to Redis...');
      await client.connect();
      console.log('Connected, getting info...');
      
      // Obter informações básicas do servidor Redis (mais rápido)
      const info = await client.info('server');
      const memoryInfo = await client.info('memory');
      
      console.log('Got server and memory info');
      
      // Parse das informações
      const serverInfo = parseRedisInfo(info);
      const memoryData = parseRedisInfo(memoryInfo);
      
      // Tentar obter configuração básica (pode falhar em alguns Redis)
      const configObj: Record<string, string> = {};
      try {
        console.log('Getting config...');
        const config = await client.configGet('*');
        const configArray = Array.isArray(config) ? config : [];
        for (let i = 0; i < configArray.length; i += 2) {
          if (configArray[i] && configArray[i + 1]) {
            configObj[String(configArray[i])] = String(configArray[i + 1]);
          }
        }
        console.log('Got config');
      } catch (configError) {
        console.warn('Não foi possível obter configurações:', configError);
        // Continuar sem configurações se não conseguir obter
      }
      
      return {
        serverInfo,
        memory: memoryData,
        config: configObj
      };
    })();
    
    // Race entre operação e timeout
    console.log('Starting race between operation and timeout...');
    const result = await Promise.race([operationPromise, timeoutPromise]);
    console.log('Operation completed successfully');
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Erro ao obter logs do Redis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ 
      error: 'Erro ao obter informações: ' + errorMessage 
    }, { status: 500 });
  } finally {
    if (client) {
      await safeDisconnect(client);
    }
  }
}

function parseRedisInfo(info: string): Record<string, string | number> {
  const lines = info.split('\r\n');
  const result: Record<string, string | number> = {};
  
  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':', 2);
      if (key && value) {
        // Tentar converter números
        if (!isNaN(Number(value))) {
          result[key] = Number(value);
        } else {
          result[key] = value;
        }
      }
    }
  }
  
  return result;
}
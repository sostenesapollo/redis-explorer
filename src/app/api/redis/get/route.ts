import { NextRequest, NextResponse } from 'next/server';
import { createRedisClient, safeDisconnect } from '../../../utils/redis-client';

export async function GET(request: NextRequest) {
  let client;
  
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const key = searchParams.get('key');
    
    if (!url) {
      return NextResponse.json({ error: 'URL do Redis é obrigatória' }, { status: 400 });
    }
    
    if (!key) {
      return NextResponse.json({ error: 'Chave é obrigatória' }, { status: 400 });
    }

    client = createRedisClient({ 
      url,
      timeout: 5000,
      maxRetriesPerRequest: 1
    });
    
    // Implementar timeout manual
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Operação demorou mais de 8 segundos')), 8000);
    });
    
    const operationPromise = (async () => {
      await client.connect();
      
      // Verificar se a chave existe
      const exists = await client.exists(key);
      if (!exists) {
        return { key, exists: false, type: null, ttl: null, value: null };
      }
      
      // Obter tipo e TTL
      const type = await client.type(key);
      const ttl = await client.ttl(key);
      let value;
      
      // Buscar valor baseado no tipo
      switch (type) {
        case 'string':
          value = await client.get(key);
          break;
        case 'list':
          value = await client.lRange(key, 0, -1);
          break;
        case 'set':
          value = await client.sMembers(key);
          break;
        case 'hash':
          value = await client.hGetAll(key);
          break;
        case 'zset':
          value = await client.zRangeWithScores(key, 0, -1);
          break;
        default:
          // Para tipos não suportados, tentar como string
          try {
            value = await client.get(key);
          } catch {
            value = '[Tipo não suportado]';
          }
      }
      
      return { key, exists: true, type, ttl, value };
    })();
    
    // Race entre operação e timeout
    const result = await Promise.race([operationPromise, timeoutPromise]);
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Erro ao obter valor da chave:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ 
      error: 'Erro ao obter valor: ' + errorMessage 
    }, { status: 500 });
  } finally {
    if (client) {
      await safeDisconnect(client);
    }
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL do Redis é obrigatória' }, { status: 400 });
    }

    const client = createClient({ url });
    
    client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await client.connect();
    
    const allKeys = await client.keys('*');
    const keysWithDetails = [];
    
    for (const key of allKeys) {
      try {
        const type = await client.type(key);
        const ttl = await client.ttl(key);
        let value;
        
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
        
        keysWithDetails.push({ key, type, ttl, value });
      } catch (keyError: any) {
        // Se houver erro com uma chave específica, adicionar com informações limitadas
        console.warn(`Erro ao processar chave ${key}:`, keyError.message);
        keysWithDetails.push({ 
          key, 
          type: 'unknown', 
          ttl: -1, 
          value: `[Erro: ${keyError.message}]` 
        });
      }
    }
    
    await client.disconnect();
    
    return NextResponse.json({ keys: keysWithDetails });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro ao carregar chaves: ' + error.message 
    }, { status: 500 });
  }
}

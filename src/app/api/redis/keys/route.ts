import { NextRequest, NextResponse } from 'next/server';
import { createRedisClient, safeDisconnect } from '../../../utils/redis-client';

export async function GET(request: NextRequest) {
  let client;
  
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL do Redis é obrigatória' }, { status: 400 });
    }

    client = createRedisClient({ url });
    await client.connect();
    
    // Debug: verificar se a conexão está funcionando
    console.log('Redis connection established, testing commands...');
    
    // Testar ping primeiro
    const pingResult = await client.ping();
    console.log('Ping successful:', pingResult);
    
    // Verificar informações do servidor
    const serverInfo = await client.info('server');
    console.log('Server info available:', serverInfo ? 'Yes' : 'No');
    
    // Verificar banco atual
    const currentDb = await client.configGet('databases');
    console.log('Current database info:', currentDb);
    
    const allKeys = await client.keys('*');
    console.log('Total keys found:', allKeys.length);
    
    // Retornar apenas as chaves com informações básicas (sem valores)
    const keysList = allKeys.map(key => ({ key }));
    
    console.log('Keys list prepared');
    
    return NextResponse.json({ keys: keysList });
  } catch (error: any) {
    console.error('Erro ao carregar chaves:', error);
    return NextResponse.json({ 
      error: 'Erro ao carregar chaves: ' + error.message 
    }, { status: 500 });
  } finally {
    if (client) {
      await safeDisconnect(client);
    }
  }
}

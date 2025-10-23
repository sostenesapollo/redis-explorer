import { NextRequest, NextResponse } from 'next/server';
import { createRedisClient, safeDisconnect } from '../../../utils/redis-client';

export async function DELETE(request: NextRequest) {
  let client;
  
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const key = searchParams.get('key');
    
    if (!url || !key) {
      return NextResponse.json({ 
        error: 'URL e chave são obrigatórios' 
      }, { status: 400 });
    }

    client = createRedisClient({ url });
    await client.connect();
    
    await client.del(key);
    
    return NextResponse.json({ success: true, message: 'Chave deletada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar chave:', error);
    return NextResponse.json({ 
      error: 'Erro ao deletar chave: ' + error.message 
    }, { status: 500 });
  } finally {
    if (client) {
      await safeDisconnect(client);
    }
  }
}

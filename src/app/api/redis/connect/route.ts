import { NextRequest, NextResponse } from 'next/server';
import { createRedisClient, testRedisConnection, safeDisconnect } from '../../../utils/redis-client';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL do Redis é obrigatória' }, { status: 400 });
    }

    const client = createRedisClient({ url });
    const connectionResult = await testRedisConnection(client);
    
    await safeDisconnect(client);
    
    if (!connectionResult.success) {
      return NextResponse.json({ 
        error: `Erro ao conectar: ${connectionResult.error}`,
        debugInfo: connectionResult.debugInfo
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conectado com sucesso',
      debugInfo: connectionResult.debugInfo
    });
  } catch (error: any) {
    console.error('Erro na conexão Redis:', error);
    return NextResponse.json({ 
      error: 'Erro ao conectar: ' + error.message 
    }, { status: 500 });
  }
}

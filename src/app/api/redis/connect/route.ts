import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL do Redis é obrigatória' }, { status: 400 });
    }

    const client = createClient({ url });
    
    client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await client.connect();
    
    // Testar conexão
    await client.ping();
    
    return NextResponse.json({ success: true, message: 'Conectado com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro ao conectar: ' + error.message 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const key = searchParams.get('key');
    
    if (!url || !key) {
      return NextResponse.json({ 
        error: 'URL e chave são obrigatórios' 
      }, { status: 400 });
    }

    const client = createClient({ url });
    
    client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await client.connect();
    
    await client.del(key);
    
    await client.disconnect();
    
    return NextResponse.json({ success: true, message: 'Chave deletada com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro ao deletar chave: ' + error.message 
    }, { status: 500 });
  }
}

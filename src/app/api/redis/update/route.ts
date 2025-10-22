import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function PUT(request: NextRequest) {
  try {
    const { url, key, type, value } = await request.json();
    
    if (!url || !key || !type || value === undefined) {
      return NextResponse.json({ 
        error: 'URL, chave, tipo e valor são obrigatórios' 
      }, { status: 400 });
    }

    const client = createClient({ url });
    
    client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await client.connect();
    
    switch (type) {
      case 'string':
        await client.set(key, value);
        break;
      case 'list':
        const listItems = JSON.parse(value);
        await client.del(key);
        if (Array.isArray(listItems)) {
          for (const item of listItems) {
            await client.lPush(key, item);
          }
        }
        break;
      case 'set':
        const setItems = JSON.parse(value);
        await client.del(key);
        if (Array.isArray(setItems)) {
          for (const item of setItems) {
            await client.sAdd(key, item);
          }
        }
        break;
      case 'hash':
        const hashItems = JSON.parse(value);
        await client.del(key);
        for (const [field, val] of Object.entries(hashItems)) {
          await client.hSet(key, field, val as string);
        }
        break;
      default:
        await client.set(key, value);
    }
    
    await client.disconnect();
    
    return NextResponse.json({ success: true, message: 'Chave atualizada com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro ao atualizar chave: ' + error.message 
    }, { status: 500 });
  }
}

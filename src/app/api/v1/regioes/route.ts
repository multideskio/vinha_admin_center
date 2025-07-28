
import { db } from '@/db/drizzle';
import { regions } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allRegions = await db.select().from(regions);
    return NextResponse.json(allRegions);
  } catch (error) {
    console.error('Erro ao buscar regiões via API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

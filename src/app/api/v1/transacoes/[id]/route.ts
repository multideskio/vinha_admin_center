
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string }}) {
    const { id } = params;
    return NextResponse.json({ message: `Endpoint para obter detalhes da transação ${id}` }, { status: 200 });
}

export async function PUT(request: Request, { params }: { params: { id: string }}) {
    const { id } = params;
    return NextResponse.json({ message: `Endpoint para atualizar a transação ${id}` }, { status: 200 });
}

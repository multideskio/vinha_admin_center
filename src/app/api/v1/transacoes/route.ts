
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({ message: "Endpoint para criar transações" }, { status: 200 });
}

export async function GET(request: Request) {
    return NextResponse.json({ message: "Endpoint para listar transações" }, { status: 200 });
}

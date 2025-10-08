import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const restartRequestSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  instanceName: z.string().min(1),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiUrl, apiKey, instanceName } = restartRequestSchema.parse(body);

    // Remove trailing slash from apiUrl
    const baseUrl = apiUrl.replace(/\/$/, '');
    
    // Restart instance using Evolution API
    const response = await fetch(`${baseUrl}/instance/restart/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Erro ao reiniciar a instância',
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Restart response:', data);

    return NextResponse.json({
      success: true,
      message: 'Instância reiniciada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro ao reiniciar:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
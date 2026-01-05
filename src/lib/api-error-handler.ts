/**
 * Centralized API error handling utilities
 */
import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode },
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ error: 'Erro desconhecido' }, { status: 500 })
}

export function validateRequired<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new ApiError(400, `Campo obrigatório: ${fieldName}`)
  }
  return value
}

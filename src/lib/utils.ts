import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function getCompanyId(): string {
  const COMPANY_ID = process.env.COMPANY_INIT
  if (!COMPANY_ID) {
    throw new Error('A variável de ambiente COMPANY_INIT não está definida.')
  }
  return COMPANY_ID as string
}

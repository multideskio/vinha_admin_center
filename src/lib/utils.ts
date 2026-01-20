import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { env } from '@/lib/env'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function getCompanyId(): string {
  return env.COMPANY_INIT
}

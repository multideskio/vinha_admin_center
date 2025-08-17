/**
* @fileoverview Classes de erro customizadas para a aplicação.
* @version 1.1
* @date 2024-08-07
* @author PH
*/
export class AppError extends Error { constructor(public code: string, message: string, public cause?: unknown){ super(message); this.name = code } }
export class ApiError extends AppError { constructor(public status: number, message: string, cause?: unknown){ super(`API_${status}`, message, cause) ; this.status = status } }
export class DatabaseError extends AppError {}

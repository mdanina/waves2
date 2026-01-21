// Типы для обработки ошибок в приложении

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  originalError?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Проблемы с сетевым подключением', public originalError?: unknown) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
















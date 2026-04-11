export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  userMessage: string;
}

export class ErrorHandler {
  static handle(error: unknown): AppError {
    console.error('[ZeptPay Error]', error);

    // Network errors
    if (error instanceof Error && error.message.includes('Network')) {
      return {
        message: error.message,
        userMessage: 'Network connection failed. Please check your internet.',
        code: 'NETWORK_ERROR'
      };
    }

    // API errors
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any;
      const status = apiError.response?.status;
      const data = apiError.response?.data;

      switch (status) {
        case 400:
          return {
            message: data?.message || 'Bad request',
            userMessage: data?.userMessage || 'Invalid information provided.',
            code: 'BAD_REQUEST',
            statusCode: 400
          };
        case 401:
          return {
            message: 'Unauthorized',
            userMessage: 'Session expired. Please login again.',
            code: 'UNAUTHORIZED',
            statusCode: 401
          };
        case 403:
          return {
            message: 'Forbidden',
            userMessage: 'You don\'t have permission for this action.',
            code: 'FORBIDDEN',
            statusCode: 403
          };
        case 409:
          return {
            message: data?.message || 'Conflict',
            userMessage: 'Merchant already exists with this email.',
            code: 'CONFLICT',
            statusCode: 409
          };
        case 422:
          return {
            message: 'Validation error',
            userMessage: data?.userMessage || 'Please check all required fields.',
            code: 'VALIDATION_ERROR',
            statusCode: 422
          };
        case 500:
          return {
            message: 'Server error',
            userMessage: 'Something went wrong. Please try again later.',
            code: 'SERVER_ERROR',
            statusCode: 500
          };
        default:
          return {
            message: data?.message || 'Unknown error',
            userMessage: data?.userMessage || 'An unexpected error occurred.',
            code: 'UNKNOWN_ERROR',
            statusCode: status
          };
      }
    }

    // Default error
    return {
      message: error instanceof Error ? error.message : 'Unknown error',
      userMessage: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR'
    };
  }

  static isNetworkError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('Network') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout')
    );
  }
}
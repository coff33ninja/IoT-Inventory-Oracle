import { RecommendationError } from '../types.js';

/**
 * Error severity levels for recommendation system
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error context for better debugging and monitoring
 */
export interface ErrorContext {
  operation: string;
  componentId?: string;
  userId?: string;
  projectId?: string;
  timestamp: string;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

/**
 * Enhanced error class for recommendation system
 */
export class RecommendationSystemError extends Error {
  public readonly type: RecommendationError['type'];
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly fallbackStrategy: string;
  public readonly retryable: boolean;
  public readonly confidence: number;

  constructor(
    type: RecommendationError['type'],
    message: string,
    context: Partial<ErrorContext> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'RecommendationSystemError';
    this.type = type;
    this.severity = severity;
    this.retryable = retryable;
    this.confidence = 0;
    
    this.context = {
      operation: context.operation || 'unknown',
      timestamp: new Date().toISOString(),
      stackTrace: this.stack,
      ...context
    };

    this.fallbackStrategy = this.determineFallbackStrategy(type);
  }

  private determineFallbackStrategy(type: RecommendationError['type']): string {
    const strategies = {
      insufficient_data: 'Use rule-based recommendations with available inventory data',
      compatibility_unknown: 'Show components from same category with compatibility warnings',
      price_data_stale: 'Display cached price data with staleness indicator and refresh timestamp',
      ai_service_error: 'Fall back to rule-based compatibility analysis using component specifications',
      external_api_error: 'Use cached data and schedule automatic retry in background'
    };

    return strategies[type] || 'Use basic fallback recommendations with reduced confidence';
  }

  /**
   * Convert to RecommendationError interface
   */
  toRecommendationError(): RecommendationError {
    return {
      type: this.type,
      message: this.message,
      fallbackStrategy: this.fallbackStrategy,
      confidence: this.confidence,
      retryable: this.retryable
    };
  }
}

/**
 * Error handler with graceful degradation strategies
 */
export class RecommendationErrorHandler {
  private errorLog: RecommendationSystemError[] = [];
  private maxLogSize: number = 1000;
  private fallbackEnabled: boolean = true;

  constructor(options: { maxLogSize?: number; fallbackEnabled?: boolean } = {}) {
    this.maxLogSize = options.maxLogSize || 1000;
    this.fallbackEnabled = options.fallbackEnabled !== false;
  }

  /**
   * Handle an error with appropriate fallback strategy
   */
  handleError<T>(
    error: any,
    context: Partial<ErrorContext>,
    fallbackValue: T,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): T {
    let systemError: RecommendationSystemError;

    if (error instanceof RecommendationSystemError) {
      systemError = error;
    } else {
      // Convert generic error to RecommendationSystemError
      const errorType = this.classifyError(error);
      systemError = new RecommendationSystemError(
        errorType,
        error.message || 'Unknown error occurred',
        context,
        severity,
        this.isRetryable(errorType)
      );
    }

    // Log the error
    this.logError(systemError);

    // Apply fallback strategy if enabled
    if (this.fallbackEnabled) {
      console.warn(`Applying fallback strategy for ${systemError.type}: ${systemError.fallbackStrategy}`);
      return fallbackValue;
    }

    // Re-throw if fallback is disabled
    throw systemError;
  }

  /**
   * Create a specific error type
   */
  createError(
    type: RecommendationError['type'],
    message: string,
    context: Partial<ErrorContext> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): RecommendationSystemError {
    return new RecommendationSystemError(type, message, context, severity);
  }

  /**
   * Classify generic errors into recommendation error types
   */
  private classifyError(error: any): RecommendationError['type'] {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('not found') || message.includes('missing') || message.includes('empty')) {
      return 'insufficient_data';
    }
    
    if (message.includes('timeout') || message.includes('network') || message.includes('fetch')) {
      return 'external_api_error';
    }
    
    if (message.includes('ai') || message.includes('gemini') || message.includes('model')) {
      return 'ai_service_error';
    }
    
    if (message.includes('price') || message.includes('cost') || message.includes('stale')) {
      return 'price_data_stale';
    }
    
    return 'compatibility_unknown';
  }

  /**
   * Determine if an error type is retryable
   */
  private isRetryable(type: RecommendationError['type']): boolean {
    const retryableTypes: RecommendationError['type'][] = [
      'external_api_error',
      'ai_service_error',
      'price_data_stale'
    ];
    
    return retryableTypes.includes(type);
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(error: RecommendationSystemError): void {
    // Add to in-memory log
    this.errorLog.push(error);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console logging based on severity
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.severity.toUpperCase()}] ${error.type}: ${error.message}`, {
      context: error.context,
      fallbackStrategy: error.fallbackStrategy
    });
  }

  /**
   * Get appropriate console method for severity
   */
  private getLogMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return console.error;
      case ErrorSeverity.HIGH:
        return console.error;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.LOW:
        return console.log;
      default:
        return console.log;
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: RecommendationSystemError[];
    errorRate: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrors = this.errorLog.filter(
      error => new Date(error.context.timestamp).getTime() > oneHourAgo
    );

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorLog.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: recentErrors.slice(-10), // Last 10 recent errors
      errorRate: recentErrors.length // Errors per hour
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): RecommendationSystemError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Check if system is healthy based on error patterns
   */
  isSystemHealthy(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getErrorStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check error rate
    if (stats.errorRate > 10) {
      issues.push(`High error rate: ${stats.errorRate} errors in the last hour`);
      recommendations.push('Investigate recent changes and check external service status');
    }

    // Check for critical errors
    const criticalErrors = stats.errorsBySeverity[ErrorSeverity.CRITICAL] || 0;
    if (criticalErrors > 0) {
      issues.push(`${criticalErrors} critical errors detected`);
      recommendations.push('Immediate attention required for critical errors');
    }

    // Check for AI service issues
    const aiErrors = stats.errorsByType['ai_service_error'] || 0;
    if (aiErrors > 5) {
      issues.push(`AI service experiencing issues: ${aiErrors} errors`);
      recommendations.push('Check AI service connectivity and API limits');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new RecommendationErrorHandler();

/**
 * Decorator for automatic error handling in service methods
 */
export function withErrorHandling<T extends any[], R>(
  operation: string,
  fallbackValue: R
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        return globalErrorHandler.handleError(
          error,
          { operation, additionalData: { args } },
          fallbackValue
        );
      }
    };

    return descriptor;
  };
}

export default RecommendationErrorHandler;
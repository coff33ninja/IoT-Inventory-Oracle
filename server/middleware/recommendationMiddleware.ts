import { Request, Response, NextFunction } from 'express';

// Request logging middleware for recommendation endpoints
export const logRecommendationRequest = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log the request
  console.log(`[RECOMMENDATION] ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    params: req.params,
    query: req.query,
    bodySize: req.body ? JSON.stringify(req.body).length : 0
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    console.log(`[RECOMMENDATION] Response ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(body).length,
      success: res.statusCode < 400
    });

    return originalJson.call(this, body);
  };

  next();
};

// Error handling middleware for recommendation endpoints
export const handleRecommendationError = (
  error: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error(`[RECOMMENDATION ERROR] ${req.method} ${req.path}`, {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    params: req.params,
    query: req.query,
    body: req.body
  });

  // Determine error type and appropriate response
  let statusCode = 500;
  let errorResponse: any = {
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error = 'Invalid request data';
    errorResponse.details = error.message;
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorResponse.error = 'Resource not found';
  } else if (error.name === 'TimeoutError') {
    statusCode = 408;
    errorResponse.error = 'Request timeout';
  } else if (error.message?.includes('insufficient_data')) {
    statusCode = 422;
    errorResponse.error = 'Insufficient data for recommendation';
  } else if (error.message?.includes('ai_service_error')) {
    statusCode = 503;
    errorResponse.error = 'AI service temporarily unavailable';
  }

  // Add fallback data for recommendation endpoints
  if (req.path.includes('/recommendations/') || req.path.includes('/analytics/') || req.path.includes('/predictions/')) {
    errorResponse.fallback = getFallbackData(req.path, req.method);
  }

  res.status(statusCode).json(errorResponse);
};

// Validation middleware for recommendation requests
export const validateRecommendationRequest = (req: Request, res: Response, next: NextFunction) => {
  const { path, method, params, body, query } = req;

  try {
    // Validate component ID parameters
    if (params.componentId && !isValidId(params.componentId)) {
      return res.status(400).json({ 
        error: 'Invalid component ID format',
        details: 'Component ID must be a non-empty string'
      });
    }

    // Validate project ID parameters
    if (params.projectId && !isValidId(params.projectId)) {
      return res.status(400).json({ 
        error: 'Invalid project ID format',
        details: 'Project ID must be a non-empty string'
      });
    }

    // Validate user ID parameters
    if (params.userId && !isValidId(params.userId)) {
      return res.status(400).json({ 
        error: 'Invalid user ID format',
        details: 'User ID must be a non-empty string'
      });
    }

    // Validate POST request bodies
    if (method === 'POST' || method === 'PUT') {
      if (path.includes('/compatibility') && (!body.componentIds || !Array.isArray(body.componentIds))) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: 'componentIds must be an array'
        });
      }

      if (path.includes('/project-suggestions') && !body.projectType) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: 'projectType is required'
        });
      }

      if (path.includes('/project-success') && (!body.components || !body.projectType)) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: 'components array and projectType are required'
        });
      }

      if (path.includes('/usage/') && (!body.projectId || !body.quantity)) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: 'projectId and quantity are required'
        });
      }
    }

    // Validate query parameters
    if (query.timeframe && !isValidTimeframe(query.timeframe as string)) {
      return res.status(400).json({ 
        error: 'Invalid timeframe parameter',
        details: 'Timeframe must be in format: 7d, 30d, 90d, 1y'
      });
    }

    if (query.horizon && isNaN(parseInt(query.horizon as string))) {
      return res.status(400).json({ 
        error: 'Invalid horizon parameter',
        details: 'Horizon must be a number'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting middleware for recommendation endpoints
export const rateLimitRecommendations = (req: Request, res: Response, next: NextFunction) => {
  // Simple in-memory rate limiting (in production, use Redis)
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // Max requests per window

  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const clientData = global.rateLimitStore.get(clientId) || { count: 0, resetTime: now + windowMs };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + windowMs;
  } else {
    clientData.count++;
  }

  global.rateLimitStore.set(clientId, clientData);

  if (clientData.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      details: `Rate limit exceeded. Max ${maxRequests} requests per minute.`,
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }

  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.count).toString(),
    'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
  });

  next();
};

// Helper functions
function isValidId(id: string): boolean {
  return typeof id === 'string' && id.trim().length > 0 && id.length < 100;
}

function isValidTimeframe(timeframe: string): boolean {
  return /^(\d+[dwmy]|all)$/.test(timeframe);
}

function getFallbackData(path: string, method: string): any {
  if (path.includes('/alternatives/')) {
    return [];
  } else if (path.includes('/predictions/')) {
    return [];
  } else if (path.includes('/compatibility')) {
    return {
      overallCompatibility: 0,
      issues: [],
      suggestions: [],
      requiredModifications: []
    };
  } else if (path.includes('/personalized/')) {
    return [];
  } else if (path.includes('/usage-patterns') || path.includes('/spending')) {
    return {};
  } else if (path.includes('/popularity') || path.includes('/project-patterns')) {
    return [];
  } else if (path.includes('/project-success')) {
    return { successProbability: 0.5, confidence: 0.1 };
  } else if (path.includes('/demand/')) {
    return { predictedDemand: 0, confidence: 0.1 };
  } else if (path.includes('/optimal-quantities')) {
    return { recommendedQuantity: 1, reasoning: 'Default fallback' };
  } else if (path.includes('/trends/')) {
    return [];
  }
  
  return null;
}

// Declare global type for rate limiting
declare global {
  var rateLimitStore: Map<string, { count: number; resetTime: number }> | undefined;
}
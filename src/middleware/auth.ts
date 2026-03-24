import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      redmineApiKey?: string;
    }
  }
}

export function apiKeyAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-redmine-api-key'] as string | undefined;
  if (!key) {
    res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized: X-Redmine-API-Key header required' },
      id: null,
    });
    return;
  }
  req.redmineApiKey = key;
  next();
}

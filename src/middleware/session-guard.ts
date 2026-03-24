import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response, NextFunction } from 'express';

export interface SessionMeta {
  transport: StreamableHTTPServerTransport;
  createdAt: number;
  lastUsedAt: number;
}

export function createSessionTTLMiddleware(
  sessions: Map<string, SessionMeta>,
  ttlMs: number,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId) { next(); return; }

    const meta = sessions.get(sessionId);
    if (meta && Date.now() - meta.createdAt > ttlMs) {
      meta.transport.close().catch(() => {});
      sessions.delete(sessionId);
      res.status(401).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Session expired' },
        id: null,
      });
      return;
    }

    if (meta) meta.lastUsedAt = Date.now();
    next();
  };
}

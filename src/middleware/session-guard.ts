import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response, NextFunction } from 'express';

export interface SessionMeta {
  transport: StreamableHTTPServerTransport;
  createdAt: number;
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
      console.info(`[session] TTL expired for session: ${sessionId.slice(0, 8)}`);
      meta.transport.close().catch((err) => console.warn('[session] transport.close error:', err));
      sessions.delete(sessionId);
      res.status(401).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Session expired' },
        id: null,
      });
      return;
    }

    next();
  };
}

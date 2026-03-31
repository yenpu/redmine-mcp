import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './config.js';
import { RedmineClient } from './client/redmine-client.js';
import { registerAllTools } from './tools/index.js';
import { apiKeyAuthMiddleware } from './middleware/auth.js';
import { createSessionTTLMiddleware, type SessionMeta } from './middleware/session-guard.js';

const config = loadConfig();

const SESSION_NOT_FOUND_RESPONSE = {
  jsonrpc: '2.0',
  error: { code: -32000, message: 'Session not found — please re-initialize' },
  id: null,
} as const;

const sessions = new Map<string, SessionMeta>();

function createMcpServer(client: RedmineClient): McpServer {
  const server = new McpServer(
    { name: 'redmine-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );
  registerAllTools(server, client);
  return server;
}

const app = express();
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

const mcpLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { jsonrpc: '2.0', error: { code: -32029, message: 'Too Many Requests' }, id: null },
});

const sessionTTL = createSessionTTLMiddleware(sessions, config.SESSION_TTL_MS);

app.post('/mcp', apiKeyAuthMiddleware, sessionTTL, mcpLimiter, async (req, res) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const method = req.body?.method ?? (Array.isArray(req.body) ? 'batch' : 'unknown');
    const sid = sessionId?.slice(0, 8) ?? 'none';
    console.info(`[req] POST sid=${sid} method=${method} active=${sessions.size} exists=${sessionId ? sessions.has(sessionId) : 'n/a'}`);

    // Initialize requests always create a fresh session, even if the
    // client still carries a (possibly stale) session ID.
    if (isInitializeRequest(req.body)) {
      if (sessionId && sessions.has(sessionId)) {
        const old = sessions.get(sessionId)!;
        old.transport.close().catch((err) => console.warn('[session] transport.close error:', err));
        sessions.delete(sessionId);
      }

      const client = new RedmineClient({
        REDMINE_BASE_URL: config.REDMINE_BASE_URL,
        REDMINE_API_KEY: req.redmineApiKey!,
      });

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, { transport, createdAt: Date.now() });
          console.info(`[session] created: ${id.slice(0, 8)}`);
        },
      });

      const server = createMcpServer(client);
      await server.connect(transport);

      // Chain our handlers AFTER server.connect() so the SDK's internal
      // onclose / onerror handlers are preserved and called first.
      const sdkOnClose = transport.onclose;
      const sdkOnError = transport.onerror;

      // Log only — do NOT delete the session here. onclose fires when
      // transport.close() is called (explicit cleanup). Session removal
      // is handled by the DELETE handler and TTL eviction.
      transport.onclose = () => {
        sdkOnClose?.();
        console.info(`[session] transport closed: ${transport.sessionId?.slice(0, 8)}`);
      };

      transport.onerror = (err) => {
        sdkOnError?.(err);
        console.error(`[session] transport error on ${transport.sessionId?.slice(0, 8)}:`, err);
      };

      await transport.handleRequest(req, res, req.body);
      return;
    }

    const meta = sessionId ? sessions.get(sessionId) : undefined;
    if (meta) {
      try {
        await meta.transport.handleRequest(req, res, req.body);
      } catch (err) {
        console.error(`[session] transport.handleRequest failed for ${sessionId?.slice(0, 8)}:`, err);
        meta.transport.close().catch((err) => console.warn('[session] transport.close error:', err));
        sessions.delete(sessionId!);
        if (!res.headersSent) {
          res.status(404).json(SESSION_NOT_FOUND_RESPONSE);
        }
      }
      return;
    }

    console.warn(`[req] POST 404 — active=${sessions.size}`);
    res.status(404).json(SESSION_NOT_FOUND_RESPONSE);
  } catch (err) {
    console.error('MCP POST error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

app.get('/mcp', apiKeyAuthMiddleware, sessionTTL, mcpLimiter, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  const sid = sessionId?.slice(0, 8) ?? 'none';
  console.info(`[req] GET sid=${sid} active=${sessions.size} exists=${sessionId ? sessions.has(sessionId) : 'n/a'}`);
  const meta = sessionId ? sessions.get(sessionId) : undefined;
  if (!meta) {
    console.warn(`[req] GET 404 — active=${sessions.size}`);
    res.status(404).json(SESSION_NOT_FOUND_RESPONSE);
    return;
  }
  try {
    await meta.transport.handleRequest(req, res);
  } catch (err) {
    console.error(`[session] transport.handleRequest failed for ${sessionId?.slice(0, 8)}:`, err);
    meta.transport.close().catch((err) => console.warn('[session] transport.close error:', err));
    sessions.delete(sessionId!);
    if (!res.headersSent) {
      res.status(404).json(SESSION_NOT_FOUND_RESPONSE);
    }
  }
});

app.delete('/mcp', apiKeyAuthMiddleware, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  const sid = sessionId?.slice(0, 8) ?? 'none';
  console.info(`[req] DELETE sid=${sid} active=${sessions.size}`);
  const meta = sessionId ? sessions.get(sessionId) : undefined;
  if (meta) {
    await meta.transport.close().catch((err) => console.warn('[session] transport.close error:', err));
    sessions.delete(sessionId!);
  }
  res.status(204).send();
});

// Evict expired sessions every 5 minutes
setInterval(() => {
  for (const [id, meta] of sessions) {
    if (Date.now() - meta.createdAt > config.SESSION_TTL_MS) {
      console.info(`[session] evicting expired session: ${id.slice(0, 8)}`);
      meta.transport.close().catch((err) => console.warn('[session] transport.close error:', err));
      sessions.delete(id);
    }
  }
}, 5 * 60_000);

console.info('[AUTH] X-Redmine-API-Key auth active — each client must supply its own Redmine API key.');
app.listen(config.PORT, config.HOST, () => {
  console.log(`Redmine MCP server running on http://${config.HOST}:${config.PORT}/mcp`);
});

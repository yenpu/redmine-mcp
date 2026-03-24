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

    if (sessionId && sessions.has(sessionId)) {
      await sessions.get(sessionId)!.transport.handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const client = new RedmineClient({
        REDMINE_BASE_URL: config.REDMINE_BASE_URL,
        REDMINE_API_KEY: req.redmineApiKey!,
      });

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, { transport, createdAt: Date.now(), lastUsedAt: Date.now() });
        },
      });

      transport.onclose = () => {
        const id = [...sessions.entries()].find(([, m]) => m.transport === transport)?.[0];
        if (id) sessions.delete(id);
      };

      const server = createMcpServer(client);
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: missing or invalid session' },
      id: null,
    });
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
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Missing or invalid session ID' });
    return;
  }
  try {
    await sessions.get(sessionId)!.transport.handleRequest(req, res);
  } catch (err) {
    console.error('MCP GET error:', err);
    if (!res.headersSent) res.status(500).send('Internal server error');
  }
});

app.delete('/mcp', apiKeyAuthMiddleware, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId && sessions.has(sessionId)) {
    await sessions.get(sessionId)!.transport.close();
    sessions.delete(sessionId);
  }
  res.status(204).send();
});

// Evict expired sessions every 5 minutes
setInterval(() => {
  for (const [id, meta] of sessions) {
    if (Date.now() - meta.createdAt > config.SESSION_TTL_MS) {
      meta.transport.close().catch(() => {});
      sessions.delete(id);
    }
  }
}, 5 * 60_000);

console.info('[AUTH] X-Redmine-API-Key auth active — each client must supply its own Redmine API key.');
app.listen(config.PORT, config.HOST, () => {
  console.log(`Redmine MCP server running on http://${config.HOST}:${config.PORT}/mcp`);
});

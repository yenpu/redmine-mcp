import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { TrackersResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerTrackerTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_trackers',
    'List all available trackers.',
    {},
    async () => {
      try {
        const data = await client.get<TrackersResponse>('/trackers');
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

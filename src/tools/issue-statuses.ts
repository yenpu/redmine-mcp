import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { IssueStatusesResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerIssueStatusTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_issue_statuses',
    'List all available issue statuses.',
    {},
    async () => {
      try {
        const data = await client.get<IssueStatusesResponse>('/issue_statuses');
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

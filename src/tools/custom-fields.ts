import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { CustomFieldsResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerCustomFieldTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_custom_fields',
    'List all custom fields. Requires admin privileges.',
    {},
    async () => {
      try {
        const data = await client.get<CustomFieldsResponse>('/custom_fields');
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

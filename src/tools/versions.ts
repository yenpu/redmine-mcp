import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { VersionsResponse, VersionResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerVersionTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_versions',
    'List versions for a project.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
    },
    async ({ project_id }) => {
      try {
        const data = await client.get<VersionsResponse>(`/projects/${project_id}/versions`);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_version',
    'Get a version by ID.',
    {
      id: z.number().int().describe('Version ID'),
    },
    async ({ id }) => {
      try {
        const data = await client.get<VersionResponse>(`/versions/${id}`);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'create_version',
    'Create a new version for a project.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
      name: z.string().describe('Version name (required)'),
      description: z.string().optional().describe('Version description'),
      status: z.enum(['open', 'locked', 'closed']).optional().describe('Version status (default: open)'),
      due_date: z.string().optional().describe('Due date (YYYY-MM-DD)'),
      sharing: z.enum(['none', 'descendants', 'hierarchy', 'tree', 'system']).optional().describe('Version sharing scope'),
      wiki_page_title: z.string().optional().describe('Wiki page title associated with this version'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async ({ project_id, ...fields }) => {
      try {
        const data = await client.post<VersionResponse>(`/projects/${project_id}/versions`, { version: fields });
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'update_version',
    'Update an existing version.',
    {
      id: z.number().int().describe('Version ID'),
      name: z.string().optional().describe('Version name'),
      description: z.string().optional().describe('Version description'),
      status: z.enum(['open', 'locked', 'closed']).optional().describe('Version status'),
      due_date: z.string().optional().describe('Due date (YYYY-MM-DD)'),
      sharing: z.enum(['none', 'descendants', 'hierarchy', 'tree', 'system']).optional().describe('Version sharing scope'),
      wiki_page_title: z.string().optional().describe('Wiki page title associated with this version'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async ({ id, ...fields }) => {
      try {
        await client.put(`/versions/${id}`, { version: fields });
        return toText({ message: `Version #${id} updated successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_version',
    'Delete a version by ID.',
    {
      id: z.number().int().describe('Version ID'),
    },
    async ({ id }) => {
      try {
        await client.delete(`/versions/${id}`);
        return toText({ message: `Version #${id} deleted successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

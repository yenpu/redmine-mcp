import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { IssueCategoriesResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerIssueCategoryTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_issue_categories',
    'List all issue categories for a project.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
    },
    async ({ project_id }) => {
      try {
        const data = await client.get<IssueCategoriesResponse>(`/projects/${project_id}/issue_categories`);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'create_issue_category',
    'Create a new issue category for a project.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
      name: z.string().describe('Category name (required)'),
      assigned_to_id: z.number().int().optional().describe('Default assignee user ID for issues in this category'),
    },
    async ({ project_id, ...fields }) => {
      try {
        const data = await client.post<{ issue_category: IssueCategoriesResponse['issue_categories'][0] }>(`/projects/${project_id}/issue_categories`, { issue_category: fields });
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'update_issue_category',
    'Update an issue category.',
    {
      id: z.number().int().describe('Issue category ID'),
      name: z.string().optional().describe('Category name'),
      assigned_to_id: z.number().int().optional().describe('Default assignee user ID'),
    },
    async ({ id, ...fields }) => {
      try {
        await client.put(`/issue_categories/${id}`, { issue_category: fields });
        return toText({ message: `Issue category #${id} updated successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_issue_category',
    'Delete an issue category.',
    {
      id: z.number().int().describe('Issue category ID'),
      reassign_to_id: z.number().int().optional().describe('Reassign existing issues to this category ID before deletion'),
    },
    async ({ id, reassign_to_id }) => {
      try {
        const suffix = reassign_to_id ? `?reassign_to_id=${reassign_to_id}` : '';
        await client.delete(`/issue_categories/${id}${suffix}`);
        return toText({ message: `Issue category #${id} deleted successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

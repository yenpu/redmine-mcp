import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { IssuesResponse, IssueResponse } from '../client/types.js';
import { handleToolError, toText, summarizeIssues } from '../utils/errors.js';

export function registerIssueTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_issues',
    'List issues with optional filters and pagination.',
    {
      project_id: z.union([z.string(), z.number()]).optional().describe('Filter by project ID or identifier'),
      status_id: z.union([z.string(), z.number()]).optional().describe('Filter by status. Use "open", "closed", "*", or a numeric ID'),
      tracker_id: z.number().int().optional().describe('Filter by tracker ID'),
      priority_id: z.number().int().optional().describe('Filter by priority ID'),
      assigned_to_id: z.union([z.number().int(), z.literal('me')]).optional().describe('Filter by assignee user ID or "me"'),
      author_id: z.number().int().optional().describe('Filter by author user ID'),
      category_id: z.number().int().optional().describe('Filter by category ID'),
      fixed_version_id: z.number().int().optional().describe('Filter by target version ID'),
      parent_id: z.number().int().optional().describe('Filter by parent issue ID'),
      subject: z.string().optional().describe('Filter by subject (substring match)'),
      updated_on: z.string().optional().describe('Filter by update date range (e.g. ">=2024-01-01")'),
      created_on: z.string().optional().describe('Filter by creation date range'),
      sort: z.string().optional().describe('Sort column, append ":desc" for descending (e.g. "updated_on:desc")'),
      include: z.string().optional().describe('Comma-separated data to include: attachments,relations,journals,watchers,changesets,allowed_statuses'),
      offset: z.number().int().min(0).default(0).describe('Number of records to skip'),
      limit: z.number().int().min(1).max(100).default(25).describe('Number of records to return (max 100)'),
    },
    async (args) => {
      try {
        const data = await client.get<IssuesResponse>('/issues', args as Record<string, unknown>);
        return summarizeIssues(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_issue',
    'Get a single issue by ID with full details.',
    {
      id: z.number().int().describe('Issue ID'),
      include: z.string().optional().describe('Comma-separated: attachments,relations,journals,watchers,changesets,allowed_statuses'),
    },
    async ({ id, include }) => {
      try {
        const params = include ? { include } : undefined;
        const data = await client.get<IssueResponse>(`/issues/${id}`, params);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'create_issue',
    'Create a new issue.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier (required)'),
      subject: z.string().max(255).describe('Issue subject (required)'),
      tracker_id: z.number().int().optional().describe('Tracker ID'),
      status_id: z.number().int().optional().describe('Status ID'),
      priority_id: z.number().int().optional().describe('Priority ID'),
      description: z.string().max(65535).optional().describe('Issue description'),
      category_id: z.number().int().optional().describe('Category ID'),
      fixed_version_id: z.number().int().optional().describe('Target version ID'),
      assigned_to_id: z.number().int().optional().describe('Assignee user ID'),
      parent_issue_id: z.number().int().optional().describe('Parent issue ID'),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Start date (YYYY-MM-DD)'),
      due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Due date (YYYY-MM-DD)'),
      estimated_hours: z.number().optional().describe('Estimated hours'),
      done_ratio: z.number().int().min(0).max(100).optional().describe('Done ratio (0-100)'),
      is_private: z.boolean().optional().describe('Whether the issue is private'),
      watcher_user_ids: z.array(z.number().int()).optional().describe('Array of watcher user IDs'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async (args) => {
      try {
        const data = await client.post<IssueResponse>('/issues', { issue: args });
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'update_issue',
    'Update an existing issue.',
    {
      id: z.number().int().describe('Issue ID'),
      subject: z.string().max(255).optional().describe('Issue subject'),
      tracker_id: z.number().int().optional().describe('Tracker ID'),
      status_id: z.number().int().optional().describe('Status ID'),
      priority_id: z.number().int().optional().describe('Priority ID'),
      description: z.string().max(65535).optional().describe('Issue description'),
      category_id: z.number().int().optional().describe('Category ID'),
      fixed_version_id: z.number().int().optional().describe('Target version ID'),
      assigned_to_id: z.number().int().optional().describe('Assignee user ID'),
      parent_issue_id: z.number().int().optional().describe('Parent issue ID'),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Start date (YYYY-MM-DD)'),
      due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Due date (YYYY-MM-DD)'),
      estimated_hours: z.number().optional().describe('Estimated hours'),
      done_ratio: z.number().int().min(0).max(100).optional().describe('Done ratio (0-100)'),
      is_private: z.boolean().optional().describe('Whether the issue is private'),
      notes: z.string().max(65535).optional().describe('Journal notes to add'),
      private_notes: z.boolean().optional().describe('Whether notes are private'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async ({ id, ...fields }) => {
      try {
        await client.put(`/issues/${id}`, { issue: fields });
        return toText({ message: `Issue #${id} updated successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_issue',
    'Delete an issue by ID.',
    {
      id: z.number().int().describe('Issue ID'),
    },
    async ({ id }) => {
      try {
        await client.delete(`/issues/${id}`);
        return toText({ message: `Issue #${id} deleted successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'add_watcher',
    'Add a watcher to an issue.',
    {
      issue_id: z.number().int().describe('Issue ID'),
      user_id: z.number().int().describe('User ID to add as watcher'),
    },
    async ({ issue_id, user_id }) => {
      try {
        await client.post(`/issues/${issue_id}/watchers`, { user_id });
        return toText({ message: `User #${user_id} added as watcher to issue #${issue_id}` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'remove_watcher',
    'Remove a watcher from an issue.',
    {
      issue_id: z.number().int().describe('Issue ID'),
      user_id: z.number().int().describe('User ID to remove as watcher'),
    },
    async ({ issue_id, user_id }) => {
      try {
        await client.delete(`/issues/${issue_id}/watchers/${user_id}`);
        return toText({ message: `User #${user_id} removed as watcher from issue #${issue_id}` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

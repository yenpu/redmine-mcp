import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { TimeEntriesResponse, TimeEntryResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerTimeEntryTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_time_entries',
    'List time entries with optional filters.',
    {
      project_id: z.union([z.string(), z.number()]).optional().describe('Filter by project ID or identifier'),
      issue_id: z.number().int().optional().describe('Filter by issue ID'),
      user_id: z.number().int().optional().describe('Filter by user ID'),
      activity_id: z.number().int().optional().describe('Filter by activity ID'),
      spent_on: z.string().optional().describe('Filter by date (YYYY-MM-DD) or range (e.g. ">=2024-01-01")'),
      from: z.string().optional().describe('Start date for range filter (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date for range filter (YYYY-MM-DD)'),
      hours: z.string().optional().describe('Filter by hours (e.g. ">=2")'),
      offset: z.number().int().min(0).default(0).describe('Number of records to skip'),
      limit: z.number().int().min(1).max(100).default(25).describe('Number of records to return (max 100)'),
    },
    async (args) => {
      try {
        const data = await client.get<TimeEntriesResponse>('/time_entries', args as Record<string, unknown>);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_time_entry',
    'Get a single time entry by ID.',
    {
      id: z.number().int().describe('Time entry ID'),
    },
    async ({ id }) => {
      try {
        const data = await client.get<TimeEntryResponse>(`/time_entries/${id}`);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'create_time_entry',
    'Log time spent on an issue or project.',
    {
      issue_id: z.number().int().optional().describe('Issue ID (required if project_id not set)'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or identifier (required if issue_id not set)'),
      spent_on: z.string().optional().describe('Date spent (YYYY-MM-DD, defaults to today)'),
      hours: z.number().positive().describe('Hours spent (required)'),
      activity_id: z.number().int().optional().describe('Activity ID (required unless a default activity is set)'),
      comments: z.string().optional().describe('Short description / comment'),
      user_id: z.number().int().optional().describe('User ID (admin only, defaults to current user)'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async (args) => {
      try {
        const data = await client.post<TimeEntryResponse>('/time_entries', { time_entry: args });
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'update_time_entry',
    'Update an existing time entry.',
    {
      id: z.number().int().describe('Time entry ID'),
      issue_id: z.number().int().optional().describe('Issue ID'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or identifier'),
      spent_on: z.string().optional().describe('Date spent (YYYY-MM-DD)'),
      hours: z.number().positive().optional().describe('Hours spent'),
      activity_id: z.number().int().optional().describe('Activity ID'),
      comments: z.string().optional().describe('Short description / comment'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async ({ id, ...fields }) => {
      try {
        await client.put(`/time_entries/${id}`, { time_entry: fields });
        return toText({ message: `Time entry #${id} updated successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_time_entry',
    'Delete a time entry by ID.',
    {
      id: z.number().int().describe('Time entry ID'),
    },
    async ({ id }) => {
      try {
        await client.delete(`/time_entries/${id}`);
        return toText({ message: `Time entry #${id} deleted successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

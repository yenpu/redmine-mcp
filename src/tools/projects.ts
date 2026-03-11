import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { ProjectsResponse, ProjectResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerProjectTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_projects',
    'List all accessible projects.',
    {
      include: z.string().optional().describe('Comma-separated: trackers,issue_categories,enabled_modules,time_entry_activities'),
      offset: z.number().int().min(0).default(0).describe('Number of records to skip'),
      limit: z.number().int().min(1).max(100).default(25).describe('Number of records to return (max 100)'),
    },
    async (args) => {
      try {
        const data = await client.get<ProjectsResponse>('/projects', args as Record<string, unknown>);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_project',
    'Get a single project by ID or identifier.',
    {
      id: z.union([z.string(), z.number()]).describe('Project ID or string identifier'),
      include: z.string().optional().describe('Comma-separated: trackers,issue_categories,enabled_modules,time_entry_activities'),
    },
    async ({ id, include }) => {
      try {
        const params = include ? { include } : undefined;
        const data = await client.get<ProjectResponse>(`/projects/${id}`, params);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'create_project',
    'Create a new project.',
    {
      name: z.string().describe('Project name (required)'),
      identifier: z.string().describe('Project identifier - lowercase, letters, digits, dashes (required)'),
      description: z.string().optional().describe('Project description'),
      homepage: z.string().optional().describe('Project homepage URL'),
      is_public: z.boolean().optional().describe('Whether the project is public'),
      parent_id: z.number().int().optional().describe('Parent project ID'),
      inherit_members: z.boolean().optional().describe('Inherit members from parent project'),
      tracker_ids: z.array(z.number().int()).optional().describe('Array of tracker IDs to enable'),
      enabled_module_names: z.array(z.string()).optional().describe('Array of module names to enable (e.g. ["issue_tracking","wiki","repository"])'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async (args) => {
      try {
        const data = await client.post<ProjectResponse>('/projects', { project: args });
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'update_project',
    'Update an existing project.',
    {
      id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
      name: z.string().optional().describe('Project name'),
      description: z.string().optional().describe('Project description'),
      homepage: z.string().optional().describe('Project homepage URL'),
      is_public: z.boolean().optional().describe('Whether the project is public'),
      inherit_members: z.boolean().optional().describe('Inherit members from parent project'),
      tracker_ids: z.array(z.number().int()).optional().describe('Array of tracker IDs to enable'),
      enabled_module_names: z.array(z.string()).optional().describe('Array of module names to enable'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async ({ id, ...fields }) => {
      try {
        await client.put(`/projects/${id}`, { project: fields });
        return toText({ message: `Project "${id}" updated successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'archive_project',
    'Archive a project.',
    {
      id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
    },
    async ({ id }) => {
      try {
        await client.put(`/projects/${id}/archive`, {});
        return toText({ message: `Project "${id}" archived successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'unarchive_project',
    'Unarchive a project.',
    {
      id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
    },
    async ({ id }) => {
      try {
        await client.put(`/projects/${id}/unarchive`, {});
        return toText({ message: `Project "${id}" unarchived successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_project',
    'Permanently delete a project and all its data. This action is irreversible.',
    {
      id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
    },
    async ({ id }) => {
      try {
        await client.delete(`/projects/${id}`);
        return toText({ message: `Project "${id}" deleted permanently` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { GroupsResponse, GroupResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerGroupTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_groups',
    'List all groups. Requires admin privileges.',
    {},
    async () => {
      try {
        const data = await client.get<GroupsResponse>('/groups');
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_group',
    'Get a group by ID. Requires admin privileges.',
    {
      id: z.number().int().describe('Group ID'),
      include: z.string().optional().describe('Comma-separated: users,memberships'),
    },
    async ({ id, include }) => {
      try {
        const params = include ? { include } : undefined;
        const data = await client.get<GroupResponse>(`/groups/${id}`, params);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'create_group',
    'Create a new group. Requires admin privileges.',
    {
      name: z.string().describe('Group name (required)'),
      user_ids: z.array(z.number().int()).optional().describe('Array of user IDs to add to the group'),
    },
    async (args) => {
      try {
        const data = await client.post<GroupResponse>('/groups', { group: args });
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'update_group',
    'Update a group. Requires admin privileges.',
    {
      id: z.number().int().describe('Group ID'),
      name: z.string().optional().describe('Group name'),
      user_ids: z.array(z.number().int()).optional().describe('Array of user IDs (replaces existing members)'),
    },
    async ({ id, ...fields }) => {
      try {
        await client.put(`/groups/${id}`, { group: fields });
        return toText({ message: `Group #${id} updated successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_group',
    'Delete a group. Requires admin privileges.',
    {
      id: z.number().int().describe('Group ID'),
    },
    async ({ id }) => {
      try {
        await client.delete(`/groups/${id}`);
        return toText({ message: `Group #${id} deleted successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'add_user_to_group',
    'Add a user to a group. Requires admin privileges.',
    {
      group_id: z.number().int().describe('Group ID'),
      user_id: z.number().int().describe('User ID to add'),
    },
    async ({ group_id, user_id }) => {
      try {
        await client.post(`/groups/${group_id}/users`, { user_id });
        return toText({ message: `User #${user_id} added to group #${group_id}` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'remove_user_from_group',
    'Remove a user from a group. Requires admin privileges.',
    {
      group_id: z.number().int().describe('Group ID'),
      user_id: z.number().int().describe('User ID to remove'),
    },
    async ({ group_id, user_id }) => {
      try {
        await client.delete(`/groups/${group_id}/users/${user_id}`);
        return toText({ message: `User #${user_id} removed from group #${group_id}` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

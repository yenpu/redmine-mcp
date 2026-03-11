import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { MembershipsResponse, MembershipResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerMembershipTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_memberships',
    'List memberships for a project.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
      offset: z.number().int().min(0).default(0).describe('Number of records to skip'),
      limit: z.number().int().min(1).max(100).default(25).describe('Number of records to return (max 100)'),
    },
    async ({ project_id, ...rest }) => {
      try {
        const data = await client.get<MembershipsResponse>(`/projects/${project_id}/memberships`, rest as Record<string, unknown>);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'add_membership',
    'Add a user or group to a project with specified roles.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
      user_id: z.number().int().optional().describe('User ID to add (provide either user_id or group_id)'),
      group_id: z.number().int().optional().describe('Group ID to add (provide either user_id or group_id)'),
      role_ids: z.array(z.number().int()).describe('Array of role IDs to assign (required)'),
    },
    async ({ project_id, ...fields }) => {
      try {
        const data = await client.post<MembershipResponse>(`/projects/${project_id}/memberships`, { membership: fields });
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'update_membership',
    'Update roles for an existing membership.',
    {
      membership_id: z.number().int().describe('Membership ID'),
      role_ids: z.array(z.number().int()).describe('Array of role IDs to assign'),
    },
    async ({ membership_id, role_ids }) => {
      try {
        await client.put(`/memberships/${membership_id}`, { membership: { role_ids } });
        return toText({ message: `Membership #${membership_id} updated successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'remove_membership',
    'Remove a membership from a project.',
    {
      membership_id: z.number().int().describe('Membership ID'),
    },
    async ({ membership_id }) => {
      try {
        await client.delete(`/memberships/${membership_id}`);
        return toText({ message: `Membership #${membership_id} removed successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { UsersResponse, UserResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerUserTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_users',
    'List users. Requires admin privileges.',
    {
      status: z.number().int().optional().describe('Filter by status: 0=anonymous, 1=active, 2=registered, 3=locked, 4=inactive'),
      name: z.string().optional().describe('Filter by name (login, firstname, lastname, or mail)'),
      group_id: z.number().int().optional().describe('Filter users belonging to a group'),
      offset: z.number().int().min(0).default(0).describe('Number of records to skip'),
      limit: z.number().int().min(1).max(100).default(25).describe('Number of records to return (max 100)'),
    },
    async (args) => {
      try {
        const data = await client.get<UsersResponse>('/users', args as Record<string, unknown>);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_user',
    'Get a user by ID.',
    {
      id: z.number().int().describe('User ID'),
      include: z.string().optional().describe('Comma-separated: memberships,groups'),
    },
    async ({ id, include }) => {
      try {
        const params = include ? { include } : undefined;
        const data = await client.get<UserResponse>(`/users/${id}`, params);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_current_user',
    'Get the currently authenticated user.',
    {
      include: z.string().optional().describe('Comma-separated: memberships,groups'),
    },
    async ({ include }) => {
      try {
        const params = include ? { include } : undefined;
        const data = await client.get<UserResponse>('/users/current', params);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'create_user',
    'Create a new user. Requires admin privileges.',
    {
      login: z.string().describe('Login name (required)'),
      firstname: z.string().describe('First name (required)'),
      lastname: z.string().describe('Last name (required)'),
      mail: z.string().email().describe('Email address (required)'),
      password: z.string().optional().describe('Password (if not set, user must use password reset)'),
      auth_source_id: z.number().int().optional().describe('Authentication source ID'),
      mail_notification: z.string().optional().describe('Email notification preference'),
      must_change_passwd: z.boolean().optional().describe('Require password change on first login'),
      generate_password: z.boolean().optional().describe('Generate random password'),
      send_information: z.boolean().optional().describe('Send account information to user'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async (args) => {
      try {
        const data = await client.post<UserResponse>('/users', { user: args });
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'update_user',
    'Update a user. Requires admin privileges.',
    {
      id: z.number().int().describe('User ID'),
      login: z.string().optional().describe('Login name'),
      firstname: z.string().optional().describe('First name'),
      lastname: z.string().optional().describe('Last name'),
      mail: z.string().email().optional().describe('Email address'),
      password: z.string().optional().describe('New password'),
      auth_source_id: z.number().int().optional().describe('Authentication source ID'),
      mail_notification: z.string().optional().describe('Email notification preference'),
      must_change_passwd: z.boolean().optional().describe('Require password change'),
      admin: z.boolean().optional().describe('Whether user has admin privileges'),
      custom_fields: z.array(z.object({ id: z.number().int(), value: z.union([z.string(), z.array(z.string())]) })).optional().describe('Custom field values'),
    },
    async ({ id, ...fields }) => {
      try {
        await client.put(`/users/${id}`, { user: fields });
        return toText({ message: `User #${id} updated successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_user',
    'Delete a user. Requires admin privileges.',
    {
      id: z.number().int().describe('User ID'),
    },
    async ({ id }) => {
      try {
        await client.delete(`/users/${id}`);
        return toText({ message: `User #${id} deleted successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

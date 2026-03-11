import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { IssueRelationsResponse, IssueRelationResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerIssueRelationTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_issue_relations',
    'List all relations for an issue.',
    {
      issue_id: z.number().int().describe('Issue ID'),
    },
    async ({ issue_id }) => {
      try {
        const data = await client.get<IssueRelationsResponse>(`/issues/${issue_id}/relations`);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_issue_relation',
    'Get a single issue relation by ID.',
    {
      relation_id: z.number().int().describe('Relation ID'),
    },
    async ({ relation_id }) => {
      try {
        const data = await client.get<IssueRelationResponse>(`/relations/${relation_id}`);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'create_issue_relation',
    'Create a relation between two issues.',
    {
      issue_id: z.number().int().describe('Source issue ID'),
      issue_to_id: z.number().int().describe('Target issue ID (required)'),
      relation_type: z.enum(['relates', 'duplicates', 'duplicated', 'blocks', 'blocked', 'precedes', 'follows', 'copied_to', 'copied_from']).describe('Type of relation (required)'),
      delay: z.number().int().optional().describe('Delay in days (for precedes/follows relations)'),
    },
    async ({ issue_id, ...fields }) => {
      try {
        const data = await client.post<IssueRelationResponse>(`/issues/${issue_id}/relations`, { relation: fields });
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_issue_relation',
    'Delete an issue relation by ID.',
    {
      relation_id: z.number().int().describe('Relation ID'),
    },
    async ({ relation_id }) => {
      try {
        await client.delete(`/relations/${relation_id}`);
        return toText({ message: `Relation #${relation_id} deleted successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

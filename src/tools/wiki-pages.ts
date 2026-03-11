import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { WikiPagesResponse, WikiPageResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerWikiPageTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'list_wiki_pages',
    'List all wiki pages for a project.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
    },
    async ({ project_id }) => {
      try {
        const data = await client.get<WikiPagesResponse>(`/projects/${project_id}/wiki/index`);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_wiki_page',
    'Get a wiki page by project and page name.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
      page_name: z.string().describe('Wiki page name/title'),
      version: z.number().int().optional().describe('Specific version number to retrieve'),
      include: z.string().optional().describe('Comma-separated: attachments'),
    },
    async ({ project_id, page_name, version, include }) => {
      try {
        const path = version
          ? `/projects/${project_id}/wiki/${page_name}/${version}`
          : `/projects/${project_id}/wiki/${page_name}`;
        const params = include ? { include } : undefined;
        const data = await client.get<WikiPageResponse>(path, params);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'create_or_update_wiki_page',
    'Create or update a wiki page. Redmine uses PUT for both create and update.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
      page_name: z.string().describe('Wiki page name/title'),
      text: z.string().describe('Wiki page content in Textile or Markdown format (required)'),
      comments: z.string().optional().describe('Edit comment for version history'),
      version: z.number().int().optional().describe('Current version number (for conflict detection)'),
    },
    async ({ project_id, page_name, ...fields }) => {
      try {
        await client.put(`/projects/${project_id}/wiki/${page_name}`, { wiki_page: fields });
        return toText({ message: `Wiki page "${page_name}" saved successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_wiki_page',
    'Delete a wiki page.',
    {
      project_id: z.union([z.string(), z.number()]).describe('Project ID or identifier'),
      page_name: z.string().describe('Wiki page name/title'),
    },
    async ({ project_id, page_name }) => {
      try {
        await client.delete(`/projects/${project_id}/wiki/${page_name}`);
        return toText({ message: `Wiki page "${page_name}" deleted successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { AttachmentResponse, UploadResponse } from '../client/types.js';
import { handleToolError, toText } from '../utils/errors.js';

export function registerAttachmentTools(server: McpServer, client: RedmineClient): void {
  server.tool(
    'upload_attachment',
    'Upload a file to Redmine and get a token. Use the token when creating/updating issues or wiki pages to attach the file.',
    {
      file_content_base64: z.string().describe('Base64-encoded file content'),
      filename: z.string().describe('Filename including extension (e.g. "screenshot.png")'),
    },
    async ({ file_content_base64, filename }) => {
      try {
        const buffer = Buffer.from(file_content_base64, 'base64');
        const data = await client.upload(buffer, filename);
        return toText({
          ...data,
          message: 'File uploaded. Use the token in uploads[] when creating/updating issues or wiki pages.',
        });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'get_attachment',
    'Get attachment metadata by ID.',
    {
      id: z.number().int().describe('Attachment ID'),
    },
    async ({ id }) => {
      try {
        const data = await client.get<AttachmentResponse>(`/attachments/${id}`);
        return toText(data);
      } catch (err) {
        return handleToolError(err);
      }
    },
  );

  server.tool(
    'delete_attachment',
    'Delete an attachment by ID.',
    {
      id: z.number().int().describe('Attachment ID'),
    },
    async ({ id }) => {
      try {
        await client.delete(`/attachments/${id}`);
        return toText({ message: `Attachment #${id} deleted successfully` });
      } catch (err) {
        return handleToolError(err);
      }
    },
  );
}

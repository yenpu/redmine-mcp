import { RedmineApiError } from '../client/redmine-client.js';

export interface ToolErrorResult {
  isError: true;
  content: [{ type: 'text'; text: string }];
}

export function handleToolError(err: unknown): ToolErrorResult {
  if (err instanceof RedmineApiError) {
    const msg = `Redmine API Error (HTTP ${err.statusCode}): ${err.redmineErrors.join(', ')}`;
    return { isError: true, content: [{ type: 'text', text: msg }] };
  }
  const msg = err instanceof Error ? err.message : String(err);
  return { isError: true, content: [{ type: 'text', text: `Unexpected error: ${msg}` }] };
}

export function toText(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

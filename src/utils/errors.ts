import { RedmineApiError } from '../client/redmine-client.js';
import type { IssuesResponse } from '../client/types.js';

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

export function summarizeIssues(data: IssuesResponse): { content: [{ type: 'text'; text: string }] } {
  const summary = {
    issues: data.issues.map((issue) => ({
      id: issue.id,
      subject: issue.subject,
      project: issue.project?.name,
      tracker: issue.tracker?.name,
      status: issue.status?.name,
      priority: issue.priority?.name,
      assigned_to: issue.assigned_to?.name,
      author: issue.author?.name,
      done_ratio: issue.done_ratio,
      start_date: issue.start_date,
      due_date: issue.due_date,
      created_on: issue.created_on,
      updated_on: issue.updated_on,
    })),
    total_count: data.total_count,
    offset: data.offset,
    limit: data.limit,
  };
  return toText(summary);
}

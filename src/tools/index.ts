import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RedmineClient } from '../client/redmine-client.js';
import { registerIssueTools } from './issues.js';
import { registerProjectTools } from './projects.js';
import { registerUserTools } from './users.js';
import { registerTimeEntryTools } from './time-entries.js';
import { registerMembershipTools } from './memberships.js';
import { registerVersionTools } from './versions.js';
import { registerIssueRelationTools } from './issue-relations.js';
import { registerWikiPageTools } from './wiki-pages.js';
import { registerAttachmentTools } from './attachments.js';
import { registerGroupTools } from './groups.js';
import { registerCustomFieldTools } from './custom-fields.js';
import { registerIssueStatusTools } from './issue-statuses.js';
import { registerTrackerTools } from './trackers.js';
import { registerIssueCategoryTools } from './issue-categories.js';

export function registerAllTools(server: McpServer, client: RedmineClient): void {
  registerIssueTools(server, client);
  registerProjectTools(server, client);
  registerUserTools(server, client);
  registerTimeEntryTools(server, client);
  registerMembershipTools(server, client);
  registerVersionTools(server, client);
  registerIssueRelationTools(server, client);
  registerWikiPageTools(server, client);
  registerAttachmentTools(server, client);
  registerGroupTools(server, client);
  registerCustomFieldTools(server, client);
  registerIssueStatusTools(server, client);
  registerTrackerTools(server, client);
  registerIssueCategoryTools(server, client);
}

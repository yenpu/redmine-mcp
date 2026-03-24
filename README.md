# redmine-mcp

MCP Server for the [Redmine](https://www.redmine.org/) REST API using Streamable HTTP transport.

Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk), this server exposes 63 tools that let any MCP-compatible client (Claude Desktop, MCP Inspector, etc.) interact with a Redmine instance.

## Features

- **63 tools** covering issues, projects, users, time entries, wiki pages, attachments, and more
- **Streamable HTTP transport** — single `/mcp` endpoint (POST / GET / DELETE)
- **Per-client authentication** — each client supplies its own Redmine API key via `X-Redmine-API-Key` header
- **Session management** with configurable TTL and automatic eviction
- **Security** — Helmet headers, rate limiting, API key validation

## Prerequisites

- Node.js >= 18
- A Redmine instance with the REST API enabled

## Setup

```bash
git clone https://github.com/user/redmine-mcp.git
cd redmine-mcp
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDMINE_BASE_URL` | Yes | — | URL of your Redmine instance |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `127.0.0.1` | Server host |
| `SESSION_TTL_MS` | No | `3600000` | Session TTL in milliseconds (1 hour) |
| `LOG_LEVEL` | No | `info` | `debug` \| `info` \| `warn` \| `error` |

> **Note:** There is no `REDMINE_API_KEY` in the server config — each MCP client supplies its own key via the `X-Redmine-API-Key` header.

## Usage

```bash
# Build
npm run build

# Start (production)
npm start

# Development (watch mode)
npm run dev
```

### Client Configuration

Add the server to your MCP client config (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "redmine": {
      "type": "streamable-http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "X-Redmine-API-Key": "<your-redmine-api-key>"
      }
    }
  }
}
```

## Available Tools

### Issues (7)
`list_issues` · `get_issue` · `create_issue` · `update_issue` · `delete_issue` · `add_issue_watcher` · `remove_issue_watcher`

### Projects (7)
`list_projects` · `get_project` · `create_project` · `update_project` · `archive_project` · `unarchive_project` · `delete_project`

### Users (6)
`list_users` · `get_user` · `get_current_user` · `create_user` · `update_user` · `delete_user`

### Groups (7)
`list_groups` · `get_group` · `create_group` · `update_group` · `delete_group` · `add_group_member` · `remove_group_member`

### Time Entries (5)
`list_time_entries` · `get_time_entry` · `create_time_entry` · `update_time_entry` · `delete_time_entry`

### Versions (5)
`list_versions` · `get_version` · `create_version` · `update_version` · `delete_version`

### Memberships (5)
`list_memberships` · `get_membership` · `add_membership` · `update_membership` · `remove_membership`

### Wiki Pages (5)
`list_wiki_pages` · `get_wiki_page` · `create_wiki_page` · `update_wiki_page` · `delete_wiki_page`

### Issue Relations (4)
`list_issue_relations` · `create_issue_relation` · `delete_issue_relation` · `get_relation_type`

### Issue Categories (4)
`list_issue_categories` · `get_category` · `create_category` · `update_category` · `delete_category`

### Attachments (3)
`upload_file` · `get_attachment` · `delete_attachment`

### Other
`list_custom_fields` · `list_issue_statuses` · `list_trackers`

## Project Structure

```
src/
├── index.ts                 # Express server, session management
├── config.ts                # Environment validation (zod)
├── client/
│   ├── redmine-client.ts    # Axios wrapper for Redmine API
│   └── types.ts             # Redmine API response types
├── middleware/               # Auth & session guards
├── tools/
│   ├── index.ts             # Tool aggregator
│   ├── issues.ts
│   ├── projects.ts
│   └── ...                  # 14 tool modules
└── utils/
    └── errors.ts            # Error handling utilities
```

## License

ISC
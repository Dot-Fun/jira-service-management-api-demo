# Jira Service Management API Demo

A TypeScript example demonstrating how to use the Jira Service Management REST API with scoped API tokens.

## What This Does

- Lists your JSM service desks
- Fetches available request types
- Creates a new service request
- Reads request details
- Adds a comment to the request

## Prerequisites

- Node.js 18+
- An Atlassian Cloud account with Jira Service Management
- A scoped API token

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/dot-fun/jira-service-management-api-demo.git
cd jira-service-management-api-demo
npm install
```

### 2. Create an API token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**
3. Select these scopes:
   - `read:servicedesk-request`
   - `write:servicedesk-request`
4. Copy the token (it's only shown once)

### 3. Get your Cloud ID

```bash
curl https://yoursite.atlassian.net/_edge/tenant_info
```

This returns: `{"cloudId":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}`

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
JIRA_EMAIL=your-email@example.com
JIRA_API_KEY=ATATT3x...your-token
JIRA_SITE_URL=yoursite.atlassian.net
JIRA_CLOUD_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Usage

```bash
npm run demo
```

Output:
```
============================================================
🚀 Jira Service Management API Demo
============================================================

📋 [read:servicedesk-request] Fetching service desks...
   Found 2 service desk(s):
   - DEMO: Demo service space (ID: 2)
   - PROJ: My Project (ID: 1)

📝 [read:servicedesk-request] Fetching request types...
✨ [write:servicedesk-request] Creating new request...
   ✅ Created: PROJ-123

💬 [write:servicedesk-request] Adding comment...
   ✅ Comment added

============================================================
✅ Demo Complete!
============================================================
```

## API Reference

This demo uses the [Jira Service Management Cloud REST API](https://developer.atlassian.com/cloud/jira/service-desk/rest/).

**Key points for scoped API tokens:**
- Use `api.atlassian.com` gateway, not direct site URL
- URL format: `https://api.atlassian.com/ex/jira/{cloudId}/rest/servicedeskapi/...`
- Auth: Basic auth with `email:token` (Base64 encoded)

## License

MIT

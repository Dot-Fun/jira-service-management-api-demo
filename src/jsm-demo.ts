/**
 * Jira Service Management REST API Demo
 *
 * This script demonstrates JSM API scopes using a scoped API token:
 * - read:servicedesk-request - Read service desks, request types, requests
 * - write:servicedesk-request - Create requests, add comments
 *
 * Scoped API tokens require:
 * 1. The api.atlassian.com gateway with Cloud ID
 * 2. Basic auth (email:token)
 */

import 'dotenv/config';

// Configuration from environment
const API_KEY = process.env.JIRA_API_KEY;
const EMAIL = process.env.JIRA_EMAIL;
const CLOUD_ID = process.env.JIRA_CLOUD_ID;
const SITE_URL = process.env.JIRA_SITE_URL || 'dotfun.atlassian.net';

if (!API_KEY || !EMAIL || !CLOUD_ID) {
  console.error('❌ Missing required environment variables:');
  if (!EMAIL) console.error('   - JIRA_EMAIL');
  if (!API_KEY) console.error('   - JIRA_API_KEY');
  if (!CLOUD_ID) console.error('   - JIRA_CLOUD_ID');
  console.error('\nTo get your Cloud ID, run:');
  console.error(`   curl https://${SITE_URL}/_edge/tenant_info`);
  process.exit(1);
}

// Scoped API tokens use api.atlassian.com gateway with Basic auth
const BASE_URL = `https://api.atlassian.com/ex/jira/${CLOUD_ID}/rest/servicedeskapi`;
const AUTH_HEADER = `Basic ${Buffer.from(`${EMAIL}:${API_KEY}`).toString('base64')}`;

// Helper for API calls
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  return response.json();
}

// Types for API responses
interface ServiceDesk {
  id: string;
  projectId: string;
  projectName: string;
  projectKey: string;
}

interface ServiceDeskResponse {
  values: ServiceDesk[];
}

interface RequestType {
  id: string;
  name: string;
  description: string;
}

interface RequestTypeResponse {
  values: RequestType[];
}

interface CustomerRequest {
  issueId: string;
  issueKey: string;
  currentStatus: {
    status: string;
  };
  _links: {
    web: string;
  };
}

interface Comment {
  id: string;
  body: string;
  author: {
    displayName: string;
  };
}

// ============================================================
// API Functions
// ============================================================

/**
 * Scope: read:servicedesk-request
 * Lists all service desks
 */
async function getServiceDesks(): Promise<ServiceDesk[]> {
  console.log('\n📋 [read:servicedesk-request] Fetching service desks...');
  const response = await apiFetch<ServiceDeskResponse>('/servicedesk');
  return response.values;
}

/**
 * Scope: read:servicedesk-request
 * Gets available request types for a service desk
 */
async function getRequestTypes(serviceDeskId: string): Promise<RequestType[]> {
  console.log(`\n📝 [read:servicedesk-request] Fetching request types...`);
  const response = await apiFetch<RequestTypeResponse>(
    `/servicedesk/${serviceDeskId}/requesttype`
  );
  return response.values;
}

/**
 * Scope: write:servicedesk-request
 * Creates a new customer request
 */
async function createRequest(
  serviceDeskId: string,
  requestTypeId: string,
  summary: string,
  description: string
): Promise<CustomerRequest> {
  console.log('\n✨ [write:servicedesk-request] Creating new request...');
  return apiFetch<CustomerRequest>('/request', {
    method: 'POST',
    body: JSON.stringify({
      serviceDeskId,
      requestTypeId,
      requestFieldValues: {
        summary,
        description,
      },
    }),
  });
}

/**
 * Scope: read:servicedesk-request
 * Gets details of a specific request
 */
async function getRequest(issueKey: string): Promise<CustomerRequest> {
  console.log(`\n🔍 [read:servicedesk-request] Fetching request ${issueKey}...`);
  return apiFetch<CustomerRequest>(`/request/${issueKey}`);
}

/**
 * Scope: write:servicedesk-request
 * Adds a comment to a request
 */
async function addComment(issueKey: string, body: string, isPublic = true): Promise<Comment> {
  console.log(`\n💬 [write:servicedesk-request] Adding comment to ${issueKey}...`);
  return apiFetch<Comment>(`/request/${issueKey}/comment`, {
    method: 'POST',
    body: JSON.stringify({ body, public: isPublic }),
  });
}

// ============================================================
// Main Demo Flow
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Jira Service Management API Demo');
  console.log('='.repeat(60));
  console.log(`\nSite: ${SITE_URL}`);
  console.log(`User: ${EMAIL}`);
  console.log(`Cloud ID: ${CLOUD_ID}`);
  console.log(`API Gateway: api.atlassian.com`);

  try {
    // 1. Get service desks
    const serviceDesks = await getServiceDesks();
    console.log(`\n   Found ${serviceDesks.length} service desk(s):`);
    serviceDesks.forEach((sd) => {
      console.log(`   - ${sd.projectKey}: ${sd.projectName} (ID: ${sd.id})`);
    });

    if (serviceDesks.length === 0) {
      console.error('\n❌ No service desks found.');
      process.exit(1);
    }

    // Use XURSM if available, otherwise first
    const targetDesk = serviceDesks.find(sd => sd.projectKey === 'XURSM') || serviceDesks[0];
    console.log(`\n   Using service desk: ${targetDesk.projectKey}`);

    // 2. Get request types
    const requestTypes = await getRequestTypes(targetDesk.id);
    console.log(`\n   Found ${requestTypes.length} request type(s):`);
    requestTypes.forEach((rt) => {
      console.log(`   - ${rt.name} (ID: ${rt.id})`);
    });

    if (requestTypes.length === 0) {
      console.error('\n❌ No request types found.');
      process.exit(1);
    }

    const requestType = requestTypes[0];
    console.log(`\n   Using request type: ${requestType.name}`);

    // 3. Create a new request
    const timestamp = new Date().toISOString();
    const request = await createRequest(
      targetDesk.id,
      requestType.id,
      `API Demo Request - ${timestamp}`,
      `This is a test request created via the JSM REST API.\n\nTimestamp: ${timestamp}`
    );
    console.log(`\n   ✅ Created: ${request.issueKey}`);
    console.log(`   Status: ${request.currentStatus.status}`);
    console.log(`   URL: ${request._links.web}`);

    // 4. Read the request back
    const fetchedRequest = await getRequest(request.issueKey);
    console.log(`\n   ✅ Successfully fetched ${fetchedRequest.issueKey}`);

    // 5. Add a comment
    const comment = await addComment(
      request.issueKey,
      'This comment was added via the JSM REST API demo script.'
    );
    console.log(`\n   ✅ Comment added by ${comment.author.displayName}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Demo Complete!');
    console.log('='.repeat(60));
    console.log(`\n📌 Created request: ${request.issueKey}`);
    console.log(`🔗 View in Jira: ${request._links.web}`);
    console.log('\nScopes demonstrated:');
    console.log('  ✓ read:servicedesk-request (list desks, request types, read request)');
    console.log('  ✓ write:servicedesk-request (create request, add comment)');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

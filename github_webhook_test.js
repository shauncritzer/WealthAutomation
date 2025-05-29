/**
 * GitHub App Webhook Validation Test Script
 * 
 * This script tests the GitHub webhook validation and event handling
 * by simulating GitHub webhook events.
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = 'https://wealthautomation-production.up.railway.app/github/webhook';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'test_secret';
const TEST_EVENTS = ['push', 'pull_request', 'deployment'];

/**
 * Generate a GitHub signature for the payload
 * @param {string} payload - JSON string payload
 * @param {string} secret - Webhook secret
 * @returns {string} GitHub signature
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  return 'sha256=' + hmac.update(payload).digest('hex');
}

/**
 * Create a sample push event payload
 * @returns {Object} Push event payload
 */
function createPushEventPayload() {
  return {
    ref: 'refs/heads/main',
    repository: {
      id: 123456,
      name: 'WealthAutomation',
      full_name: 'shauncritzer/WealthAutomation',
      owner: {
        login: 'shauncritzer'
      }
    },
    sender: {
      login: 'github-app-test'
    },
    commits: [
      {
        id: 'abc123',
        message: 'Test commit',
        timestamp: new Date().toISOString()
      }
    ]
  };
}

/**
 * Create a sample pull request event payload
 * @returns {Object} Pull request event payload
 */
function createPullRequestEventPayload() {
  return {
    action: 'opened',
    number: 1,
    pull_request: {
      id: 123456,
      title: 'Test pull request',
      html_url: 'https://github.com/shauncritzer/WealthAutomation/pull/1',
      user: {
        login: 'github-app-test'
      }
    },
    repository: {
      id: 123456,
      name: 'WealthAutomation',
      full_name: 'shauncritzer/WealthAutomation',
      owner: {
        login: 'shauncritzer'
      }
    },
    sender: {
      login: 'github-app-test'
    }
  };
}

/**
 * Create a sample deployment event payload
 * @returns {Object} Deployment event payload
 */
function createDeploymentEventPayload() {
  return {
    deployment: {
      id: 123456,
      environment: 'production',
      description: 'Test deployment',
      creator: {
        login: 'github-app-test'
      }
    },
    repository: {
      id: 123456,
      name: 'WealthAutomation',
      full_name: 'shauncritzer/WealthAutomation',
      owner: {
        login: 'shauncritzer'
      }
    },
    sender: {
      login: 'github-app-test'
    }
  };
}

/**
 * Send a test webhook event
 * @param {string} eventType - GitHub event type
 * @returns {Promise<Object>} Response data
 */
async function sendTestEvent(eventType) {
  try {
    let payload;
    
    // Create payload based on event type
    switch (eventType) {
      case 'push':
        payload = createPushEventPayload();
        break;
      case 'pull_request':
        payload = createPullRequestEventPayload();
        break;
      case 'deployment':
        payload = createDeploymentEventPayload();
        break;
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }
    
    // Convert payload to JSON string
    const payloadString = JSON.stringify(payload);
    
    // Generate signature
    const signature = generateSignature(payloadString, WEBHOOK_SECRET);
    
    // Send request
    console.log(`Sending test ${eventType} event to ${WEBHOOK_URL}`);
    const response = await axios({
      method: 'post',
      url: WEBHOOK_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': eventType,
        'X-Hub-Signature-256': signature,
        'X-GitHub-Delivery': crypto.randomBytes(16).toString('hex')
      },
      data: payload
    });
    
    console.log(`${eventType} event response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error sending ${eventType} event:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

/**
 * Test webhook endpoint health
 * @returns {Promise<boolean>} Whether the endpoint is healthy
 */
async function testWebhookHealth() {
  try {
    const response = await axios.get(`${WEBHOOK_URL.replace('/github/webhook', '')}/health`);
    console.log('Health check response:', response.data);
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // Check webhook health
    const isHealthy = await testWebhookHealth();
    if (!isHealthy) {
      console.error('Webhook endpoint is not healthy, aborting tests');
      return;
    }
    
    // Test each event type
    for (const eventType of TEST_EVENTS) {
      await sendTestEvent(eventType);
    }
    
    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  generateSignature,
  sendTestEvent,
  testWebhookHealth,
  runTests
};

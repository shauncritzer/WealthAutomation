/**
 * GitHub Webhook Handler for WealthAutomationHQ
 * 
 * This script handles incoming webhooks from GitHub, validates signatures,
 * and processes events like push, pull request, and deployment.
 */

const crypto = require('crypto');
const { getInstallationToken, cloneRepository, pushChanges } = require('./github_app_automation');

// Environment variables
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const GITHUB_REPO_OWNER = 'shauncritzer';
const GITHUB_REPO_NAME = 'WealthAutomation';

/**
 * Validate GitHub webhook signature
 * @param {Object} req - Express request object
 * @returns {boolean} Whether the signature is valid
 */
function validateGitHubSignature(req) {
  if (!GITHUB_WEBHOOK_SECRET) {
    console.warn('GitHub webhook secret not configured, skipping validation');
    return true;
  }
  
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    console.error('No GitHub signature found in request headers');
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
  const payload = JSON.stringify(req.body);
  const calculatedSignature = 'sha256=' + hmac.update(payload).digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    console.error(`Error validating GitHub signature: ${error.message}`);
    return false;
  }
}

/**
 * Handle GitHub push event
 * @param {Object} payload - Push event payload
 * @returns {Promise<Object>} Processing result
 */
async function handlePushEvent(payload) {
  try {
    console.log(`Received push event to ${payload.ref} from ${payload.sender.login}`);
    
    // Only process pushes to main branch
    if (payload.ref !== 'refs/heads/main') {
      return { 
        status: 'skipped', 
        message: `Ignoring push to ${payload.ref}, only main branch is processed` 
      };
    }
    
    // Process the push event
    // For example, trigger a deployment or content update
    console.log(`Processing push to main branch with ${payload.commits.length} commits`);
    
    // Here you would add your custom logic for handling pushes
    // For example, triggering a Railway deployment
    
    return { 
      status: 'success', 
      message: `Processed push to main branch with ${payload.commits.length} commits` 
    };
  } catch (error) {
    console.error(`Error handling push event: ${error.message}`);
    return { status: 'error', message: error.message };
  }
}

/**
 * Handle GitHub pull request event
 * @param {Object} payload - Pull request event payload
 * @returns {Promise<Object>} Processing result
 */
async function handlePullRequestEvent(payload) {
  try {
    console.log(`Received pull request event: ${payload.action} by ${payload.sender.login}`);
    
    // Only process opened or synchronized pull requests
    if (!['opened', 'synchronize', 'reopened'].includes(payload.action)) {
      return { 
        status: 'skipped', 
        message: `Ignoring pull request ${payload.action} event` 
      };
    }
    
    // Process the pull request
    // For example, run tests or preview deployments
    console.log(`Processing pull request #${payload.number}: ${payload.pull_request.title}`);
    
    // Here you would add your custom logic for handling pull requests
    
    return { 
      status: 'success', 
      message: `Processed pull request #${payload.number}` 
    };
  } catch (error) {
    console.error(`Error handling pull request event: ${error.message}`);
    return { status: 'error', message: error.message };
  }
}

/**
 * Handle GitHub deployment event
 * @param {Object} payload - Deployment event payload
 * @returns {Promise<Object>} Processing result
 */
async function handleDeploymentEvent(payload) {
  try {
    console.log(`Received deployment event for ${payload.deployment.environment}`);
    
    // Only process production deployments
    if (payload.deployment.environment !== 'production') {
      return { 
        status: 'skipped', 
        message: `Ignoring deployment to ${payload.deployment.environment}` 
      };
    }
    
    // Process the deployment
    console.log(`Processing deployment to production: ${payload.deployment.description}`);
    
    // Here you would add your custom logic for handling deployments
    
    return { 
      status: 'success', 
      message: `Processed deployment to production` 
    };
  } catch (error) {
    console.error(`Error handling deployment event: ${error.message}`);
    return { status: 'error', message: error.message };
  }
}

/**
 * Configure GitHub webhook routes for Express app
 * @param {Object} app - Express app instance
 */
function configureGitHubWebhooks(app) {
  // GitHub webhook endpoint
  app.post('/github/webhook', async (req, res) => {
    try {
      // Validate webhook signature
      if (!validateGitHubSignature(req)) {
        console.error('Invalid GitHub webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      // Get event type from headers
      const event = req.headers['x-github-event'];
      if (!event) {
        console.error('No GitHub event type specified');
        return res.status(400).json({ error: 'No event type specified' });
      }
      
      console.log(`Received GitHub ${event} event`);
      let result;
      
      // Route to appropriate handler based on event type
      switch (event) {
        case 'push':
          result = await handlePushEvent(req.body);
          break;
        case 'pull_request':
          result = await handlePullRequestEvent(req.body);
          break;
        case 'deployment':
          result = await handleDeploymentEvent(req.body);
          break;
        default:
          console.log(`Ignoring unsupported event type: ${event}`);
          result = { status: 'skipped', message: `Event type ${event} not supported` };
      }
      
      // Respond to webhook
      res.status(200).json({ 
        status: result.status,
        message: result.message
      });
    } catch (error) {
      console.error(`Error handling GitHub webhook: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // GitHub webhook test endpoint
  app.get('/github/webhook/test', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      message: 'GitHub webhook endpoint is configured correctly'
    });
  });
}

module.exports = { configureGitHubWebhooks };

/**
 * Webhook Handler for WealthAutomationHQ
 * 
 * This script handles incoming webhooks from Make.com, ConvertKit,
 * GitHub, and other services, routing them to the appropriate handlers.
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const contentGeneration = require('./content_generation');
const { configureGitHubWebhooks } = require('./github_webhook_handler');

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Environment variables
const PORT = process.env.PORT || 3000;
const MAKE_WEBHOOK_SECRET = process.env.MAKE_WEBHOOK_SECRET;
const CONVERTKIT_API_SECRET = process.env.CONVERTKIT_API_SECRET;

/**
 * Validate Make.com webhook signature
 * @param {Object} req - Express request object
 * @returns {boolean} Whether the signature is valid
 */
function validateMakeSignature(req) {
  if (!MAKE_WEBHOOK_SECRET) return true; // Skip validation if no secret configured
  
  const signature = req.headers['x-make-signature'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', MAKE_WEBHOOK_SECRET);
  const calculatedSignature = hmac.update(JSON.stringify(req.body)).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

/**
 * Validate ConvertKit webhook signature
 * @param {Object} req - Express request object
 * @returns {boolean} Whether the signature is valid
 */
function validateConvertKitSignature(req) {
  if (!CONVERTKIT_API_SECRET) return true; // Skip validation if no secret configured
  
  const signature = req.headers['x-convertkit-signature'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', CONVERTKIT_API_SECRET);
  const calculatedSignature = hmac.update(JSON.stringify(req.body)).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

/**
 * Handle content generation webhook from Make.com
 */
app.post('/webhooks/make/generate-content', async (req, res) => {
  try {
    // Validate webhook signature
    if (!validateMakeSignature(req)) {
      console.error('Invalid Make.com webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    console.log('Received content generation webhook from Make.com');
    
    // Extract options from webhook payload
    const options = {
      topic: req.body.topic || '',
      mock: req.body.mock === true,
      live: req.body.live === true
    };
    
    // Generate content asynchronously
    contentGeneration.main(options)
      .then(result => {
        console.log('Content generation completed successfully');
        console.log(`Generated post: ${result.title}`);
      })
      .catch(error => {
        console.error(`Content generation failed: ${error.message}`);
      });
    
    // Respond immediately to webhook
    res.status(202).json({ 
      status: 'accepted',
      message: 'Content generation started'
    });
  } catch (error) {
    console.error(`Error handling Make.com webhook: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle ConvertKit subscriber webhook
 */
app.post('/webhooks/convertkit/subscriber', async (req, res) => {
  try {
    // Validate webhook signature
    if (!validateConvertKitSignature(req)) {
      console.error('Invalid ConvertKit webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    console.log('Received subscriber webhook from ConvertKit');
    
    // Extract subscriber data
    const { subscriber } = req.body;
    if (!subscriber || !subscriber.email) {
      return res.status(400).json({ error: 'Invalid subscriber data' });
    }
    
    // Process subscriber (e.g., add to database, trigger welcome sequence)
    console.log(`New subscriber: ${subscriber.email}`);
    
    // Respond to webhook
    res.status(200).json({ 
      status: 'success',
      message: 'Subscriber processed'
    });
  } catch (error) {
    console.error(`Error handling ConvertKit webhook: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Configure GitHub webhooks
configureGitHubWebhooks(app);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Start the server
 */
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});

module.exports = app;

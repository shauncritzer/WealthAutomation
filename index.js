/**
 * Main entry point for WealthAutomationHQ backend
 * Initializes the webhook handler and GitHub App integration
 */

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const webhookHandler = require('./webhook_handler');
// const githubWebhookHandler = require('./github_webhook_handler');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    // Make raw body available for webhook signature verification
    req.rawBody = buf;
  }
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send({
    status: 'ok',
    message: 'WealthAutomationHQ backend is running',
    version: '1.0.0'
  });
});

// GitHub webhook endpoint
app.post('/github/webhook', (req, res) => {
  // const githubWebhookHandler.handleWebhook(req, res);
});

// General webhook endpoint
app.post('/webhook', (req, res) => {
  webhookHandler.handleWebhook(req, res);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WealthAutomationHQ backend listening on port ${PORT}`);
  console.log(`GitHub webhook endpoint: http://localhost:${PORT}/github/webhook`);
  console.log(`General webhook endpoint: http://localhost:${PORT}/webhook`);
});

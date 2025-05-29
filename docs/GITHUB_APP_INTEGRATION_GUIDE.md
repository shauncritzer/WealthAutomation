# GitHub App Integration Guide for WealthAutomationHQ

This comprehensive guide will walk you through setting up and using the GitHub App integration for your WealthAutomationHQ automation system. This approach provides permanent, secure access for automation without the limitations of personal access tokens.

## 1. Creating Your GitHub App

1. Go to GitHub → Settings → Developer settings → GitHub Apps → New GitHub App
2. Fill in the following details:
   - **GitHub App name**: WealthAutomationBot
   - **Homepage URL**: https://wealthautomationhq.com
   - **Webhook URL**: https://wealthautomation-production.up.railway.app/github/webhook
   - **Webhook secret**: Generate a secure random string (see below for methods)
   - **Permissions**:
     - Repository permissions:
       - Contents: Read & Write
       - Workflows: Read & Write
       - Deployments: Read & Write
       - Metadata: Read-only
   - **Subscribe to events**:
     - Push
     - Pull request
     - Deployment
3. Click "Create GitHub App"

### Generating a Webhook Secret

Use one of these methods to generate a secure random string:

```javascript
// Node.js
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('hex'));
```

```bash
# Command line
openssl rand -hex 32
```

```python
# Python
import secrets
print(secrets.token_hex(32))
```

## 2. Generating a Private Key

1. After creating the app, scroll down to the "Private keys" section
2. Click "Generate a private key"
3. This will download a .pem file to your computer
4. Keep this file secure - it's used to authenticate as the GitHub App

## 3. Installing the App on Your Repository

1. Go to the app's settings page
2. Click "Install App" in the sidebar
3. Choose your GitHub account
4. Select "Only select repositories" and choose "WealthAutomation"
5. Click "Install"
6. Note the Installation ID from the URL (it will be a number)

## 4. Configuring Railway Environment Variables

Add these environment variables to your Railway project:

1. **GITHUB_APP_ID**: Your GitHub App's ID (found in the app settings)
2. **GITHUB_INSTALLATION_ID**: The installation ID from Step 3
3. **GITHUB_PRIVATE_KEY**: The contents of the .pem file (with newlines replaced by "\n")
4. **GITHUB_WEBHOOK_SECRET**: The webhook secret you generated in Step 1

## 5. How the Integration Works

The GitHub App integration provides these benefits:

1. **Permanent Access**: Unlike personal access tokens, GitHub Apps don't expire
2. **Fine-grained Permissions**: Only request exactly what's needed
3. **Enhanced Security**: Uses JWT-based authentication
4. **Audit Trail**: All actions are logged and attributable

The system includes:

1. **GitHub App Authentication**: Secure token generation and management
2. **Webhook Handler**: Processes GitHub events securely
3. **Automation Scripts**: Trigger deployments and content updates

## 6. Testing the Integration

After setup, you can verify the integration is working by:

1. Making a small change to your repository
2. Pushing the change to GitHub
3. Checking the Railway logs for webhook events
4. Verifying that the automation responds correctly

## 7. Troubleshooting

If you encounter issues:

1. **Webhook not receiving events**:
   - Verify the webhook URL is correct in GitHub App settings
   - Check that the webhook secret matches in both GitHub and Railway
   - Ensure the app is installed on the correct repository

2. **Authentication failures**:
   - Verify the GITHUB_APP_ID and GITHUB_INSTALLATION_ID are correct
   - Check that the GITHUB_PRIVATE_KEY is properly formatted
   - Ensure the app has the necessary permissions

3. **Deployment issues**:
   - Check Railway logs for specific error messages
   - Verify that GitHub Actions workflows are correctly configured
   - Ensure Railway environment variables are properly set

## 8. Security Best Practices

1. Keep your private key secure and rotate it periodically
2. Use a strong webhook secret
3. Regularly audit GitHub App permissions
4. Monitor GitHub App activity in your repository

This integration provides a robust, secure foundation for your automated content and deployment system.

# GitHub App Configuration Guide for Railway

This document provides instructions for configuring the GitHub App environment variables in Railway to ensure proper integration with your WealthAutomationHQ automation system.

## Required Environment Variables

Add the following environment variables to your Railway project:

1. **GITHUB_APP_ID**
   - Description: The ID of your GitHub App
   - How to find: In GitHub App settings under "About" section
   - Example: `123456`

2. **GITHUB_INSTALLATION_ID**
   - Description: The installation ID for your repository
   - How to find: In the URL when you install the app on your repository
   - Example: `12345678`

3. **GITHUB_PRIVATE_KEY**
   - Description: The private key for your GitHub App
   - How to find: Generated in GitHub App settings, downloaded as .pem file
   - Format: Copy the entire contents of the .pem file, replacing newlines with "\n"
   - Example: `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1c7N9...\n-----END RSA PRIVATE KEY-----`

4. **GITHUB_WEBHOOK_SECRET**
   - Description: The secret used to validate GitHub webhook payloads
   - How to find: The secret you created when setting up the GitHub App
   - Example: `your_webhook_secret_here`

## Setting Up in Railway

1. Go to your Railway project dashboard
2. Click on "Variables" in the left sidebar
3. Add each of the variables above with their corresponding values
4. Click "Save Changes"

## Verifying the Configuration

To verify that your GitHub App configuration is working correctly:

1. Push a commit to your repository
2. Check the Railway logs for webhook events
3. Verify that the automation responds to the push event

If you encounter any issues, check that:
- All environment variables are correctly set
- The webhook URL in GitHub App settings points to `https://wealthautomation-production.up.railway.app/github/webhook`
- The GitHub App has the correct permissions (Contents, Workflows, Deployments)

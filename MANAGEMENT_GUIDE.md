# WealthAutomationHQ System Management Guide

## System Overview

The WealthAutomationHQ system is a fully automated content generation and monetization platform that includes:

1. **Automated Content Generation**: Daily blog posts created using OpenAI's GPT-4
2. **Multi-Channel Distribution**: Content published to WordPress and ConvertKit
3. **Monetization**: Automated affiliate offer injection based on content topics
4. **Integrations**: ConvertKit, WordPress, Discord, Make.com, and Google Sheets

## Accessing Your Dashboard

### GitHub Repository
- **URL**: https://github.com/shauncritzer/WealthAutomation
- **Access**: Use your GitHub credentials

### Railway Dashboard
- **URL**: https://railway.app/project/86161a20-f54f-4660-ae26-da109959bcb1
- **Service**: WealthAutomation
- **Environment**: production

## Monitoring Your System

### Discord Notifications
All system events are sent to your Discord channel via the webhook. You'll receive notifications for:
- Successful content generation and publishing
- Deployment updates
- Error alerts

### Error Logs
Error logs are stored in two locations:
1. **Railway Logs**: Access via Railway dashboard → WealthAutomation → Logs
2. **Local Logs**: In the `/logs/errors.txt` file in the repository

### Content Logs
All generated content is logged in:
1. **JSON Log**: `/logs/post_log.json` - Contains metadata for all posts
2. **Individual Files**: `/logs/blog-{uniqueId}.txt` - Contains full content when in mock mode

## Managing Your System

### Environment Variables
All sensitive credentials are stored as environment variables in Railway:
- ConvertKit API credentials
- WordPress API credentials
- OpenAI API key
- Discord webhook URL
- Make.com webhook URL
- Google Sheets ID

To update any credential:
1. Go to Railway dashboard → WealthAutomation → Variables
2. Click the variable you want to update
3. Enter the new value
4. The system will automatically redeploy

### Affiliate Offers
Affiliate offers are managed in the `affiliate/affiliate_offers.json` file:
1. Edit this file in the GitHub repository
2. Add, remove, or modify offers as needed
3. Commit and push changes
4. The system will automatically deploy the updated offers

## Triggering Content Generation

### Automatic Schedule
Content is generated automatically according to the cron schedule in Railway:
- Current schedule: Daily at 9:00 AM

### Manual Trigger
To manually trigger content generation:
1. Go to Railway dashboard → WealthAutomation → Deployments
2. Click "Redeploy"
3. The system will generate and publish new content

### Testing in Mock Mode
To test content generation without publishing:
1. SSH into your Railway instance or use the Railway CLI
2. Run: `node content_generation.js --mock`
3. Check the `/logs` directory for the generated content

## Rollback Procedures

### Rolling Back Code Changes
If you need to roll back to a previous version:
1. Go to GitHub repository → Commits
2. Find the commit you want to roll back to
3. Click "Revert"
4. The system will automatically deploy the reverted version

### Restoring from Backup
Complete backups of your system are maintained in:
1. GitHub repository history
2. Railway deployment history

To restore from a specific deployment:
1. Go to Railway dashboard → WealthAutomation → Deployments
2. Find the deployment you want to restore
3. Click "Redeploy from this build"

## Troubleshooting Common Issues

### Content Not Generating
1. Check OpenAI API key in Railway variables
2. Verify cron job is running in Railway
3. Check error logs for specific issues

### WordPress Publishing Errors
1. Verify WordPress API URL and credentials
2. Check permalink settings in WordPress
3. Ensure the WordPress REST API is enabled

### ConvertKit Integration Issues
1. Verify ConvertKit API key and secret
2. Check tag IDs are correct
3. Ensure broadcast permissions are enabled for the API key

## Getting Support

If you encounter any issues that you cannot resolve:
1. Check the comprehensive documentation in the `/docs` directory
2. Review the error logs for specific error messages
3. Contact support with the error details and logs

## Future Enhancements

The system is designed to be easily extended. Potential enhancements include:
1. Adding more distribution channels (YouTube, social media)
2. Implementing A/B testing for affiliate offers
3. Adding analytics dashboard for performance tracking
4. Integrating with additional monetization platforms

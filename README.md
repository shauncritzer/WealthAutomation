# WealthAutomationHQ Backend

This is the backend service for WealthAutomationHQ with enhanced cron job management capabilities.

## Features

- ✅ Manual cron job triggers
- ✅ Web dashboard for monitoring
- ✅ Automated content generation
- ✅ WordPress and ConvertKit integration
- ✅ Real-time logging and status tracking

## Endpoints

- `GET /` - Health check
- `GET /dashboard` - Web dashboard
- `POST /api/cron/trigger` - Manual cron job trigger
- `GET /api/cron/status` - System status
- `GET /api/cron/logs` - View logs

## Deployment

This service is deployed on Railway and automatically updates when commits are pushed to the main branch.

Last updated: $(date)

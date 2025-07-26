/**
 * Enhanced WealthAutomationHQ Backend with Cron Job Management
 * Integrates cron job functionality with web interface and manual triggers
 */

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

// Serve static files for web interface
app.use(express.static('public'));

// Import cron job functionality
let cronJobs;
try {
  cronJobs = require('./current_cron_jobs');
} catch (error) {
  console.log('Cron jobs module not found, creating basic functionality');
  cronJobs = {
    runWealthAutomationCycle: async () => ({ success: false, error: 'Cron module not available' }),
    scheduleCronJobs: () => console.log('Cron scheduling not available'),
    logMessage: (msg) => console.log(msg)
  };
}

// Store cron job status and logs
let cronStatus = {
  isRunning: false,
  lastRun: null,
  lastResult: null,
  scheduledJobs: [],
  logs: []
};

// Utility function to add log entry
function addLog(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message
  };
  
  cronStatus.logs.unshift(logEntry);
  
  // Keep only last 100 logs
  if (cronStatus.logs.length > 100) {
    cronStatus.logs = cronStatus.logs.slice(0, 100);
  }
  
  console.log(`[${timestamp}] [${level}] ${message}`);
}

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send({
    status: 'ok',
    message: 'WealthAutomationHQ backend is running',
    version: '2.0.0',
    features: ['cron_jobs', 'manual_triggers', 'web_interface'],
    cronStatus: {
      isRunning: cronStatus.isRunning,
      lastRun: cronStatus.lastRun,
      scheduledJobs: cronStatus.scheduledJobs.length
    }
  });
});

// Cron job management endpoints
app.get('/api/cron/status', (req, res) => {
  res.json({
    success: true,
    data: cronStatus
  });
});

app.get('/api/cron/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({
    success: true,
    data: {
      logs: cronStatus.logs.slice(0, limit),
      total: cronStatus.logs.length
    }
  });
});

// Manual trigger endpoint for wealth automation cycle
app.post('/api/cron/trigger', async (req, res) => {
  if (cronStatus.isRunning) {
    return res.status(409).json({
      success: false,
      error: 'Cron job is already running'
    });
  }

  addLog('Manual trigger initiated', 'INFO');
  cronStatus.isRunning = true;
  cronStatus.lastRun = new Date().toISOString();

  try {
    const result = await cronJobs.runWealthAutomationCycle();
    
    cronStatus.isRunning = false;
    cronStatus.lastResult = result;
    
    if (result.success) {
      addLog('Manual trigger completed successfully', 'SUCCESS');
      res.json({
        success: true,
        message: 'Wealth automation cycle completed successfully',
        data: result
      });
    } else {
      addLog(`Manual trigger failed: ${result.error}`, 'ERROR');
      res.status(500).json({
        success: false,
        error: result.error,
        data: result
      });
    }
  } catch (error) {
    cronStatus.isRunning = false;
    cronStatus.lastResult = { success: false, error: error.message };
    addLog(`Manual trigger error: ${error.message}`, 'ERROR');
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize cron scheduling
app.post('/api/cron/schedule', (req, res) => {
  try {
    cronJobs.scheduleCronJobs();
    cronStatus.scheduledJobs = [
      {
        name: 'Daily Content Generation',
        schedule: '0 9 * * 1-5',
        timezone: 'America/New_York',
        description: 'Generates and publishes content Monday-Friday at 9 AM'
      }
    ];
    
    addLog('Cron jobs scheduled successfully', 'SUCCESS');
    
    res.json({
      success: true,
      message: 'Cron jobs scheduled successfully',
      data: {
        scheduledJobs: cronStatus.scheduledJobs
      }
    });
  } catch (error) {
    addLog(`Failed to schedule cron jobs: ${error.message}`, 'ERROR');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Web interface endpoint
app.get('/dashboard', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WealthAutomationHQ Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.running { background: #f39c12; color: white; }
        .status.idle { background: #27ae60; color: white; }
        .status.error { background: #e74c3c; color: white; }
        .btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #2980b9; }
        .btn:disabled { background: #bdc3c7; cursor: not-allowed; }
        .logs { max-height: 400px; overflow-y: auto; background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; }
        .log-entry { margin-bottom: 5px; }
        .log-timestamp { color: #95a5a6; }
        .log-level-INFO { color: #3498db; }
        .log-level-SUCCESS { color: #27ae60; }
        .log-level-ERROR { color: #e74c3c; }
        .log-level-WARN { color: #f39c12; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 WealthAutomationHQ Dashboard</h1>
            <p>Automated Content Generation & Publishing System</p>
        </div>

        <div class="card">
            <h2>System Status</h2>
            <p><strong>Status:</strong> <span id="systemStatus" class="status idle">Loading...</span></p>
            <p><strong>Last Run:</strong> <span id="lastRun">Never</span></p>
            <p><strong>Scheduled Jobs:</strong> <span id="scheduledJobs">0</span></p>
        </div>

        <div class="card">
            <h2>Manual Controls</h2>
            <button id="triggerBtn" class="btn" onclick="triggerCronJob()">🎯 Run Content Generation Now</button>
            <button id="scheduleBtn" class="btn" onclick="scheduleJobs()">⏰ Enable Scheduled Jobs</button>
            <button class="btn" onclick="refreshStatus()">🔄 Refresh Status</button>
        </div>

        <div class="card">
            <h2>Recent Logs</h2>
            <div id="logs" class="logs">Loading logs...</div>
        </div>
    </div>

    <script>
        let isRunning = false;

        async function refreshStatus() {
            try {
                const response = await fetch('/api/cron/status');
                const data = await response.json();
                
                if (data.success) {
                    const status = data.data;
                    isRunning = status.isRunning;
                    
                    document.getElementById('systemStatus').textContent = isRunning ? 'Running' : 'Idle';
                    document.getElementById('systemStatus').className = 'status ' + (isRunning ? 'running' : 'idle');
                    document.getElementById('lastRun').textContent = status.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never';
                    document.getElementById('scheduledJobs').textContent = status.scheduledJobs.length;
                    
                    document.getElementById('triggerBtn').disabled = isRunning;
                }
            } catch (error) {
                console.error('Failed to refresh status:', error);
            }
        }

        async function refreshLogs() {
            try {
                const response = await fetch('/api/cron/logs?limit=20');
                const data = await response.json();
                
                if (data.success) {
                    const logsContainer = document.getElementById('logs');
                    logsContainer.innerHTML = data.data.logs.map(log => 
                        '<div class="log-entry">' +
                        '<span class="log-timestamp">[' + new Date(log.timestamp).toLocaleString() + ']</span> ' +
                        '<span class="log-level-' + log.level + '">[' + log.level + ']</span> ' +
                        log.message +
                        '</div>'
                    ).join('');
                }
            } catch (error) {
                console.error('Failed to refresh logs:', error);
            }
        }

        async function triggerCronJob() {
            if (isRunning) return;
            
            document.getElementById('triggerBtn').disabled = true;
            document.getElementById('triggerBtn').textContent = '⏳ Running...';
            
            try {
                const response = await fetch('/api/cron/trigger', { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    alert('✅ Content generation completed successfully!');
                } else {
                    alert('❌ Content generation failed: ' + data.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            } finally {
                document.getElementById('triggerBtn').textContent = '🎯 Run Content Generation Now';
                setTimeout(refreshStatus, 1000);
                setTimeout(refreshLogs, 1000);
            }
        }

        async function scheduleJobs() {
            try {
                const response = await fetch('/api/cron/schedule', { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    alert('✅ Cron jobs scheduled successfully!');
                    refreshStatus();
                } else {
                    alert('❌ Failed to schedule jobs: ' + data.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        // Auto-refresh every 10 seconds
        setInterval(() => {
            refreshStatus();
            refreshLogs();
        }, 10000);

        // Initial load
        refreshStatus();
        refreshLogs();
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

// GitHub webhook endpoint
app.post('/github/webhook', (req, res) => {
  addLog('GitHub webhook received', 'INFO');
  res.status(200).json({ status: 'received' });
});

// General webhook endpoint
app.post('/webhook', (req, res) => {
  addLog('General webhook received', 'INFO');
  res.status(200).json({ status: 'received' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  addLog(`WealthAutomationHQ backend listening on port ${PORT}`, 'SUCCESS');
  addLog(`Dashboard available at: http://localhost:${PORT}/dashboard`, 'INFO');
  addLog(`API endpoints: /api/cron/status, /api/cron/trigger, /api/cron/schedule`, 'INFO');
  
  // Initialize cron jobs on startup if enabled
  if (process.env.AUTO_START_CRON === 'true') {
    try {
      cronJobs.scheduleCronJobs();
      cronStatus.scheduledJobs = [
        {
          name: 'Daily Content Generation',
          schedule: '0 9 * * 1-5',
          timezone: 'America/New_York',
          description: 'Generates and publishes content Monday-Friday at 9 AM'
        }
      ];
      addLog('Auto-started scheduled cron jobs', 'SUCCESS');
    } catch (error) {
      addLog(`Failed to auto-start cron jobs: ${error.message}`, 'ERROR');
    }
  }
});


/**
 * WealthAutomationHQ - Complete Backend System
 * Automated Content Generation & Publishing Platform
 * Version: 3.1.0 - Test Mode
 */

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Try to load cron modules, with fallback handling
let contentGeneration, wordpressIntegration, convertkitIntegration;

try {
    // Use test module for immediate functionality
    contentGeneration = require('./content_generation_test');
    console.log('✅ Content generation TEST module loaded successfully');
} catch (error) {
    console.log('⚠️ Content generation module not available:', error.message);
}

try {
    wordpressIntegration = require('./wordpress_integration');
    console.log('✅ WordPress integration module loaded successfully');
} catch (error) {
    console.log('⚠️ WordPress integration module not available:', error.message);
}

try {
    convertkitIntegration = require('./convertkit_integration');
    console.log('✅ ConvertKit integration module loaded successfully');
} catch (error) {
    console.log('⚠️ ConvertKit integration module not available:', error.message);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use(express.static('public'));

// Logging function
function logMessage(level, message) {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    
    // Write to log file
    const logFile = path.join(logsDir, 'system.log');
    fs.appendFileSync(logFile, logEntry + '\n');
}

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'WealthAutomationHQ backend is running',
        version: '3.1.0-test',
        timestamp: new Date().toISOString(),
        modules: {
            contentGeneration: !!contentGeneration,
            wordpressIntegration: !!wordpressIntegration,
            convertkitIntegration: !!convertkitIntegration
        }
    });
});

// Dashboard endpoint
app.get('/dashboard', (req, res) => {
    const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WealthAutomationHQ Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .card { background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .status-item { text-align: center; padding: 1rem; }
        .status-value { font-size: 2rem; font-weight: bold; color: #667eea; }
        .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .btn { padding: 1rem 2rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        .btn-primary { background: #667eea; color: white; }
        .btn-success { background: #48bb78; color: white; }
        .btn-info { background: #4299e1; color: white; }
        .btn-warning { background: #ed8936; color: white; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .logs { background: #2d3748; color: #e2e8f0; padding: 1.5rem; border-radius: 8px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.9rem; max-height: 400px; overflow-y: auto; }
        .log-error { color: #fc8181; }
        .log-success { color: #68d391; }
        .log-info { color: #63b3ed; }
        .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
        .badge-success { background: #c6f6d5; color: #22543d; }
        .badge-warning { background: #faf089; color: #744210; }
        .badge-test { background: #bee3f8; color: #2a4365; }
        .test-mode { background: #bee3f8; color: #2a4365; padding: 0.5rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 WealthAutomationHQ Dashboard</h1>
        <p>Automated Content Generation & Publishing System</p>
        <p><strong>System Status:</strong> Version: 3.1.0-test | Port: ${PORT} | Node: ${process.version}</p>
        <div class="test-mode">
            <strong>🧪 TEST MODE ACTIVE</strong> - Using fallback content generation for immediate testing
        </div>
    </div>
    
    <div class="container">
        <div class="card">
            <h2>System Status</h2>
            <div class="status-grid">
                <div class="status-item">
                    <div class="status-value">Ready</div>
                    <div>Status</div>
                </div>
                <div class="status-item">
                    <div class="status-value">Never</div>
                    <div>Last Run</div>
                </div>
                <div class="status-item">
                    <div class="status-value">1</div>
                    <div>Scheduled Jobs</div>
                </div>
                <div class="status-item">
                    <div class="status-value">
                        <span class="badge badge-test">test mode</span>
                    </div>
                    <div>System Health</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Manual Controls</h2>
            <div class="controls">
                <button class="btn btn-primary" onclick="runContentGeneration()">🎯 Run Content Generation Now</button>
                <button class="btn btn-warning" onclick="enableScheduledJobs()">⏰ Enable Scheduled Jobs</button>
                <button class="btn btn-info" onclick="refreshStatus()">🔄 Refresh Status</button>
                <button class="btn btn-success" onclick="testSystem()">🧪 Test System</button>
            </div>
        </div>

        <div class="card">
            <h2>Recent Logs</h2>
            <div class="logs" id="logs">
                <div class="log-info">[${new Date().toLocaleString()}] [INFO] Dashboard loaded successfully</div>
                <div class="log-success">[${new Date().toLocaleString()}] [SUCCESS] WealthAutomationHQ backend listening on port ${PORT}</div>
                <div class="log-info">[${new Date().toLocaleString()}] [INFO] Test mode active - ready for content generation</div>
            </div>
        </div>
    </div>

    <script>
        function runContentGeneration() {
            console.log('Triggering content generation...');
            
            fetch('/api/cron/trigger', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                console.log('Response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Content generation result:', data);
                alert('Content generation triggered! Check the logs for results.');
                setTimeout(refreshStatus, 2000);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error triggering content generation. Check console for details.');
            });
        }

        function enableScheduledJobs() {
            fetch('/api/cron/schedule', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    console.log('Scheduled jobs enabled:', data);
                    alert('Scheduled jobs enabled! Daily content generation will run Monday-Friday at 9 AM EST.');
                    refreshStatus();
                })
                .catch(error => console.error('Error:', error));
        }

        function refreshStatus() {
            location.reload();
        }

        function testSystem() {
            fetch('/api/test')
                .then(response => response.json())
                .then(data => {
                    console.log('System test result:', data);
                    alert('System test completed. Check console for details.');
                })
                .catch(error => console.error('Error:', error));
        }

        // Auto-refresh every 30 seconds
        setInterval(refreshStatus, 30000);
    </script>
</body>
</html>`;
    
    res.send(dashboardHTML);
});

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        testMode: true,
        modules: {
            contentGeneration: !!contentGeneration,
            wordpressIntegration: !!wordpressIntegration,
            convertkitIntegration: !!convertkitIntegration
        }
    });
});

app.post('/api/cron/trigger', async (req, res) => {
    try {
        logMessage('INFO', 'Manual trigger initiated');
        
        if (!contentGeneration) {
            logMessage('ERROR', 'Manual trigger failed: Content generation module not available');
            return res.status(500).json({
                success: false,
                error: 'Content generation module not available'
            });
        }

        // Generate content
        const topic = 'Building wealth through automation and smart systems';
        logMessage('INFO', `Generating content for topic: ${topic}`);
        
        const content = await contentGeneration.generateContent(topic);
        
        if (content.success) {
            logMessage('SUCCESS', `Content generated successfully: ${content.topic} (${content.wordCount} words)`);
            
            // Save content to file for review
            const contentFile = path.join(logsDir, `generated-content-${Date.now()}.txt`);
            fs.writeFileSync(contentFile, `Topic: ${content.topic}\nGenerated: ${content.generatedAt}\nType: ${content.type}\nWord Count: ${content.wordCount}\n\n${content.content}`);
            logMessage('INFO', `Content saved to: ${contentFile}`);
            
            // Try to post to WordPress if available
            if (wordpressIntegration) {
                try {
                    logMessage('INFO', 'Attempting WordPress post creation...');
                    const post = await wordpressIntegration.createPost({
                        title: `Daily Insight: ${content.topic}`,
                        content: content.content,
                        status: 'draft' // Use draft for testing
                    });
                    logMessage('SUCCESS', `WordPress post created: ${post.id}`);
                } catch (wpError) {
                    logMessage('ERROR', `WordPress posting failed: ${wpError.message}`);
                }
            }
            
            // Try to send email if available
            if (convertkitIntegration) {
                try {
                    logMessage('INFO', 'Attempting ConvertKit email broadcast...');
                    const email = await convertkitIntegration.sendBroadcast({
                        subject: `Daily Insight: ${content.topic}`,
                        content: content.content
                    });
                    logMessage('SUCCESS', `Email broadcast sent: ${email.id}`);
                } catch (emailError) {
                    logMessage('ERROR', `Email sending failed: ${emailError.message}`);
                }
            }
            
            res.json({
                success: true,
                content: {
                    topic: content.topic,
                    type: content.type,
                    wordCount: content.wordCount,
                    generatedAt: content.generatedAt,
                    testMode: content.testMode || false
                },
                timestamp: new Date().toISOString()
            });
        } else {
            logMessage('ERROR', `Content generation failed: ${content.error}`);
            res.status(500).json({
                success: false,
                error: content.error
            });
        }
        
    } catch (error) {
        logMessage('ERROR', `Manual trigger failed: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/cron/schedule', (req, res) => {
    try {
        // Schedule daily content generation at 9 AM EST
        cron.schedule('0 9 * * 1-5', async () => {
            logMessage('INFO', 'Scheduled content generation started');
            
            if (contentGeneration) {
                try {
                    const topic = 'Daily motivation and business insights';
                    const content = await contentGeneration.generateContent(topic);
                    logMessage('SUCCESS', 'Scheduled content generated successfully');
                } catch (error) {
                    logMessage('ERROR', `Scheduled content generation failed: ${error.message}`);
                }
            }
        });
        
        logMessage('SUCCESS', 'Cron jobs scheduled successfully');
        res.json({
            success: true,
            message: 'Scheduled jobs enabled',
            schedule: 'Daily at 9 AM EST (Monday-Friday)'
        });
        
    } catch (error) {
        logMessage('ERROR', `Cron scheduling failed: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/test', (req, res) => {
    const testResults = {
        timestamp: new Date().toISOString(),
        testMode: true,
        modules: {
            contentGeneration: !!contentGeneration,
            wordpressIntegration: !!wordpressIntegration,
            convertkitIntegration: !!convertkitIntegration
        },
        environment: {
            nodeVersion: process.version,
            port: PORT,
            platform: process.platform
        }
    };
    
    logMessage('INFO', 'System test completed');
    res.json(testResults);
});

// Webhook endpoints (for future use)
app.post('/webhook', (req, res) => {
    logMessage('INFO', 'Webhook received');
    res.json({ received: true });
});

app.post('/github/webhook', (req, res) => {
    logMessage('INFO', 'GitHub webhook received');
    res.json({ received: true });
});

// Error handling middleware
app.use((error, req, res, next) => {
    logMessage('ERROR', `Unhandled error: ${error.message}`);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logMessage('SUCCESS', `WealthAutomationHQ backend listening on port ${PORT}`);
    logMessage('INFO', `Dashboard available at: http://localhost:${PORT}/dashboard`);
    logMessage('INFO', 'API endpoints: /api/cron/status, /api/cron/trigger, /api/cron/schedule');
    logMessage('INFO', 'Test mode active - using fallback content generation');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logMessage('INFO', 'SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logMessage('INFO', 'SIGINT received, shutting down gracefully');
    process.exit(0);
});


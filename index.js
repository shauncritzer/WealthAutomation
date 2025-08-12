/**
 * WealthAutomationHQ - Live System with Full API Integration
 * Version: 4.0.0 - Production Ready
 */

const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

// Import live modules
const contentGeneration = require('./live_content_generation');
const wordpressIntegration = require('./live_wordpress_integration');
const convertkitIntegration = require('./live_convertkit_integration');

// Load affiliate offers
const affiliateOffers = require('./affiliate_offers.json');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());

// System state
let systemStats = {
    postsGenerated: 0,
    emailsSent: 0,
    lastRun: null,
    isRunning: false,
    errors: []
};

// Affiliate offer rotation
let currentOfferIndex = 0;

function getNextAffiliateOffer() {
    const offer = affiliateOffers.offers[currentOfferIndex];
    currentOfferIndex = (currentOfferIndex + 1) % affiliateOffers.offers.length;
    return offer;
}

// Main content generation and publishing workflow
async function runContentWorkflow(manualTrigger = false) {
    if (systemStats.isRunning) {
        console.log('Content workflow already running, skipping...');
        return { success: false, error: 'Workflow already in progress' };
    }

    systemStats.isRunning = true;
    systemStats.lastRun = new Date().toISOString();

    try {
        console.log(`Starting content workflow (${manualTrigger ? 'manual' : 'scheduled'})...`);

        // Step 1: Select affiliate offer
        const affiliateOffer = getNextAffiliateOffer();
        console.log('Selected affiliate offer:', affiliateOffer.name);

        // Step 2: Generate content
        console.log('Generating content with AI...');
        const contentResult = await contentGeneration.generateContent(null, affiliateOffer);
        
        if (!contentResult.success) {
            throw new Error(`Content generation failed: ${contentResult.error}`);
        }

        console.log('Content generated successfully:', contentResult.title);

        // Step 3: Publish to WordPress
        console.log('Publishing to WordPress...');
        const wpResult = await wordpressIntegration.createPost({
            title: contentResult.title,
            content: contentResult.content,
            excerpt: contentResult.excerpt,
            status: 'publish',
            categories: contentResult.categories,
            tags: contentResult.tags,
            seoTitle: contentResult.seoTitle,
            seoDescription: contentResult.seoDescription
        });

        if (!wpResult.success) {
            throw new Error(`WordPress publishing failed: ${wpResult.error}`);
        }

        console.log('WordPress post published:', wpResult.url);
        systemStats.postsGenerated++;

        // Step 4: Generate email content
        console.log('Generating email content...');
        const emailContentResult = await contentGeneration.generateEmailContent(
            contentResult.title,
            contentResult.content,
            wpResult.url,
            affiliateOffer
        );

        if (!emailContentResult.success) {
            console.log('Email content generation failed, using fallback');
        }

        // Step 5: Send ConvertKit broadcast
        console.log('Sending ConvertKit broadcast...');
        const emailContent = emailContentResult.success ? 
            emailContentResult.content : 
            createFallbackEmailContent(contentResult.title, wpResult.url, affiliateOffer);

        const emailSubject = emailContentResult.success ? 
            emailContentResult.subject : 
            `New post: ${contentResult.title}`;

        const ckResult = await convertkitIntegration.createAndSendBroadcast(
            emailSubject,
            emailContent,
            `Automated broadcast for: ${contentResult.title}`
        );

        if (ckResult.success) {
            console.log('ConvertKit broadcast sent successfully');
            systemStats.emailsSent++;
        } else {
            console.log('ConvertKit broadcast failed:', ckResult.error);
        }

        // Step 6: Log results
        const workflowResult = {
            success: true,
            timestamp: new Date().toISOString(),
            manualTrigger: manualTrigger,
            content: {
                title: contentResult.title,
                wordCount: contentResult.wordCount,
                topic: contentResult.topic
            },
            wordpress: {
                success: wpResult.success,
                url: wpResult.url,
                id: wpResult.id
            },
            email: {
                success: ckResult.success,
                subject: emailSubject,
                broadcastId: ckResult.broadcast?.id
            },
            affiliate: {
                name: affiliateOffer.name,
                category: affiliateOffer.categories[0]
            }
        };

        console.log('Content workflow completed successfully!');
        return workflowResult;

    } catch (error) {
        console.error('Content workflow failed:', error.message);
        systemStats.errors.push({
            timestamp: new Date().toISOString(),
            error: error.message,
            type: 'workflow'
        });

        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

    } finally {
        systemStats.isRunning = false;
    }
}

function createFallbackEmailContent(title, url, affiliateOffer) {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">WealthAutomationHQ</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Building Wealth Through Smart Automation</p>
    </div>
    
    <div style="padding: 30px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hey there,</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">I just published a new post that I think you'll find valuable: <strong>${title}</strong></p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">This one's packed with practical insights and actionable strategies you can implement right away.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Read the Full Post →</a>
        </div>
        
        ${affiliateOffer ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-bottom: 15px;">🚀 Recommended Resource</h3>
            <p style="margin-bottom: 15px; color: #856404;">${affiliateOffer.description}</p>
            <div style="text-align: center;">
                <a href="${affiliateOffer.url}" target="_blank" style="background: #856404; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Check Out ${affiliateOffer.name} →</a>
            </div>
        </div>
        ` : ''}
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Talk soon,<br><strong>Shaun Critzer</strong></p>
            <p style="font-size: 14px; color: #666;">Founder, WealthAutomationHQ</p>
        </div>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>You're receiving this because you subscribed to WealthAutomationHQ updates.</p>
        <p><a href="{{unsubscribe_url}}" style="color: #667eea;">Unsubscribe</a> | <a href="https://wealthautomationhq.com" style="color: #667eea;">Visit Website</a></p>
    </div>
</div>`;
}

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'WealthAutomationHQ Live System',
        version: '4.0.0',
        timestamp: new Date().toISOString(),
        stats: systemStats
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
    <title>WealthAutomationHQ Live Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .card { background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .btn { padding: 1rem 2rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; background: #667eea; color: white; margin: 0.5rem; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat { background: white; padding: 1.5rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2rem; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 0.5rem; }
        .logs { background: #2d3748; color: #e2e8f0; padding: 1.5rem; border-radius: 8px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.9rem; max-height: 400px; overflow-y: auto; }
        .live-mode { background: #c6f6d5; color: #22543d; padding: 0.5rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
        .status-running { color: #38a169; }
        .status-idle { color: #667eea; }
        .status-error { color: #e53e3e; }
        #result { margin-top: 1rem; padding: 1rem; background: #f7fafc; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 WealthAutomationHQ Live Dashboard</h1>
        <p>AI-Powered Content Generation & Publishing System</p>
        <p><strong>System Status:</strong> Version: 4.0.0 | Port: ${PORT} | Node: ${process.version}</p>
        <div class="live-mode">
            <strong>🔴 LIVE MODE ACTIVE</strong> - Real WordPress posting & ConvertKit automation
        </div>
    </div>
    
    <div class="container">
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${systemStats.postsGenerated}</div>
                <div class="stat-label">Posts Generated</div>
            </div>
            <div class="stat">
                <div class="stat-number">${systemStats.emailsSent}</div>
                <div class="stat-label">Emails Sent</div>
            </div>
            <div class="stat">
                <div class="stat-number">${affiliateOffers.offers.length}</div>
                <div class="stat-label">Affiliate Offers</div>
            </div>
            <div class="stat">
                <div class="stat-number status-${systemStats.isRunning ? 'running' : 'idle'}">${systemStats.isRunning ? 'RUNNING' : 'IDLE'}</div>
                <div class="stat-label">System Status</div>
            </div>
        </div>

        <div class="card">
            <h2>Live Content Generation</h2>
            <p><strong>Last Run:</strong> ${systemStats.lastRun || 'Never'}</p>
            <p><strong>Next Affiliate Offer:</strong> ${affiliateOffers.offers[currentOfferIndex].name}</p>
            <button class="btn" onclick="runContentGeneration()" ${systemStats.isRunning ? 'disabled' : ''}>
                🎯 Generate & Publish Content Now
            </button>
            <button class="btn" onclick="testSystem()">🧪 Test System</button>
            <button class="btn" onclick="refreshStatus()">🔄 Refresh Status</button>
            <div id="result"></div>
        </div>

        <div class="card">
            <h2>Automation Schedule</h2>
            <p>Daily content generation: Monday-Friday at 9:00 AM EST</p>
            <p>Next scheduled run: <span id="nextRun">Calculating...</span></p>
            <button class="btn" onclick="enableScheduledJobs()">⏰ Enable Scheduled Jobs</button>
        </div>

        <div class="card">
            <h2>System Logs</h2>
            <div class="logs" id="logs">
                <div>[${new Date().toLocaleString()}] [SUCCESS] Live system active - WordPress & ConvertKit ready</div>
                <div>[${new Date().toLocaleString()}] [INFO] ${affiliateOffers.offers.length} affiliate offers loaded</div>
                <div>[${new Date().toLocaleString()}] [INFO] Ready for content generation and publishing</div>
            </div>
        </div>
    </div>

    <script>
        function runContentGeneration() {
            const resultDiv = document.getElementById('result');
            const button = event.target;
            
            button.disabled = true;
            button.textContent = '⏳ Generating Content...';
            resultDiv.innerHTML = '<p>🚀 Starting content workflow...</p>';
            
            fetch('/api/cron/trigger', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resultDiv.innerHTML = \`
                        <h3>✅ Content Workflow Completed!</h3>
                        <p><strong>Title:</strong> \${data.content.title}</p>
                        <p><strong>WordPress:</strong> <a href="\${data.wordpress.url}" target="_blank">View Post</a></p>
                        <p><strong>Email:</strong> \${data.email.success ? 'Sent successfully' : 'Failed'}</p>
                        <p><strong>Affiliate Offer:</strong> \${data.affiliate.name}</p>
                        <p><strong>Word Count:</strong> \${data.content.wordCount}</p>
                    \`;
                } else {
                    resultDiv.innerHTML = \`<p style="color: red;">❌ Error: \${data.error}</p>\`;
                }
            })
            .catch(error => {
                resultDiv.innerHTML = \`<p style="color: red;">❌ Network Error: \${error.message}</p>\`;
            })
            .finally(() => {
                button.disabled = false;
                button.textContent = '🎯 Generate & Publish Content Now';
                setTimeout(refreshStatus, 2000);
            });
        }

        function testSystem() {
            fetch('/api/test')
                .then(response => response.json())
                .then(data => {
                    alert('System test completed. Check console for details.');
                    console.log('System test result:', data);
                })
                .catch(error => console.error('Error:', error));
        }

        function refreshStatus() {
            location.reload();
        }

        function enableScheduledJobs() {
            fetch('/api/cron/schedule', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                })
                .catch(error => console.error('Error:', error));
        }

        // Calculate next run time
        function updateNextRun() {
            const now = new Date();
            const nextRun = new Date();
            nextRun.setHours(9, 0, 0, 0);
            
            if (nextRun <= now) {
                nextRun.setDate(nextRun.getDate() + 1);
            }
            
            // Skip weekends
            while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
                nextRun.setDate(nextRun.getDate() + 1);
            }
            
            document.getElementById('nextRun').textContent = nextRun.toLocaleString();
        }
        
        updateNextRun();
        setInterval(updateNextRun, 60000); // Update every minute
    </script>
</body>
</html>`;
    
    res.send(dashboardHTML);
});

// API Routes
app.get('/api/test', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        status: 'live',
        version: '4.0.0',
        modules: {
            contentGeneration: true,
            wordpressIntegration: true,
            convertkitIntegration: true
        },
        environment: {
            nodeVersion: process.version,
            port: PORT,
            platform: process.platform
        },
        stats: systemStats,
        affiliateOffers: affiliateOffers.offers.length
    });
});

app.post('/api/cron/trigger', async (req, res) => {
    try {
        console.log('Manual content generation triggered');
        
        const result = await runContentWorkflow(true);
        
        res.json(result);
        
    } catch (error) {
        console.error('Manual trigger failed:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/cron/schedule', (req, res) => {
    try {
        // Schedule content generation Monday-Friday at 9 AM EST
        cron.schedule('0 9 * * 1-5', async () => {
            console.log('Scheduled content generation starting...');
            await runContentWorkflow(false);
        }, {
            timezone: "America/New_York"
        });

        res.json({
            success: true,
            message: 'Scheduled jobs enabled: Monday-Friday at 9:00 AM EST'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
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
    console.log(`WealthAutomationHQ Live System listening on port ${PORT}`);
    console.log(`Dashboard available at: http://localhost:${PORT}/dashboard`);
    console.log('Live mode active - WordPress & ConvertKit integration ready');
    console.log(`Loaded ${affiliateOffers.offers.length} affiliate offers`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Force deployment - Mon Aug 11 21:35:52 EDT 2025

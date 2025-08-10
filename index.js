/**
 * WealthAutomationHQ - Simple Working Version
 * Version: 3.2.0 - Minimal Test
 */

const express = require('express');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());

// Simple content generation function
function generateTestContent(topic) {
    const content = `# ${topic}: My Personal Journey to Success

Hey everyone, Shaun here.

I want to share something deeply personal about ${topic.toLowerCase()} that completely transformed my life and business.

## The Struggle Was Real

When I was battling addiction, ${topic.toLowerCase()} seemed impossible. I was broke, broken, and barely holding on. My special needs son needed me to be better, but I didn't know how to change.

That's when I discovered the power of automation and smart systems.

## The Breakthrough Moment

Here's what changed everything for me:

**1. I Started Small**
Instead of trying to overhaul my entire life, I focused on one automated system at a time. Small wins built momentum.

**2. I Embraced Technology**
I realized that ${topic.toLowerCase()} wasn't about working harder - it was about working smarter. Automation became my secret weapon.

**3. I Stayed Consistent**
Recovery taught me that consistency beats perfection every time. I showed up daily, even when I didn't feel like it.

## What This Means for You

If you're struggling with ${topic.toLowerCase()}, here's my advice:

- **Start where you are** - You don't need to be perfect to begin
- **Use systems** - Let technology do the heavy lifting
- **Stay consistent** - Small daily actions create massive results
- **Get support** - You don't have to do this alone

## Your Next Step

Ready to transform your approach to ${topic.toLowerCase()}? 

I've built a complete automation system that generates content, builds audiences, and creates passive income - all while you focus on what matters most.

**Click here to see how I'm helping others build wealth through automation →**

Remember: Your past doesn't define your future. Your next decision does.

What will you choose today?

---

*P.S. If this resonated with you, share it with someone who needs to hear this message. Sometimes we all need a reminder that change is possible.*`;

    return {
        success: true,
        content: content,
        topic: topic,
        type: 'blog',
        generatedAt: new Date().toISOString(),
        wordCount: content.split(' ').length,
        testMode: true
    };
}

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'WealthAutomationHQ backend is running',
        version: '3.2.0-simple',
        timestamp: new Date().toISOString()
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
        .btn { padding: 1rem 2rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; background: #667eea; color: white; margin: 0.5rem; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .logs { background: #2d3748; color: #e2e8f0; padding: 1.5rem; border-radius: 8px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.9rem; max-height: 400px; overflow-y: auto; }
        .test-mode { background: #bee3f8; color: #2a4365; padding: 0.5rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
        #result { margin-top: 1rem; padding: 1rem; background: #f7fafc; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 WealthAutomationHQ Dashboard</h1>
        <p>Automated Content Generation & Publishing System</p>
        <p><strong>System Status:</strong> Version: 3.2.0-simple | Port: ${PORT} | Node: ${process.version}</p>
        <div class="test-mode">
            <strong>🧪 SIMPLE TEST MODE</strong> - Basic content generation ready for testing
        </div>
    </div>
    
    <div class="container">
        <div class="card">
            <h2>Manual Content Generation Test</h2>
            <button class="btn" onclick="runContentGeneration()">🎯 Generate Content Now</button>
            <button class="btn" onclick="testSystem()">🧪 Test System</button>
            <div id="result"></div>
        </div>

        <div class="card">
            <h2>System Logs</h2>
            <div class="logs" id="logs">
                <div>[${new Date().toLocaleString()}] [SUCCESS] Simple test mode active</div>
                <div>[${new Date().toLocaleString()}] [INFO] Ready for content generation</div>
            </div>
        </div>
    </div>

    <script>
        function runContentGeneration() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<p>Generating content...</p>';
            
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
                        <h3>✅ Content Generated Successfully!</h3>
                        <p><strong>Topic:</strong> \${data.content.topic}</p>
                        <p><strong>Word Count:</strong> \${data.content.wordCount}</p>
                        <p><strong>Generated:</strong> \${data.content.generatedAt}</p>
                        <p><strong>Test Mode:</strong> \${data.content.testMode ? 'Yes' : 'No'}</p>
                        <details>
                            <summary>View Generated Content</summary>
                            <pre style="white-space: pre-wrap; margin-top: 1rem;">\${data.content.content}</pre>
                        </details>
                    \`;
                } else {
                    resultDiv.innerHTML = \`<p style="color: red;">❌ Error: \${data.error}</p>\`;
                }
            })
            .catch(error => {
                resultDiv.innerHTML = \`<p style="color: red;">❌ Network Error: \${error.message}</p>\`;
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
    </script>
</body>
</html>`;
    
    res.send(dashboardHTML);
});

// API Routes
app.get('/api/test', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        status: 'working',
        version: '3.2.0-simple',
        environment: {
            nodeVersion: process.version,
            port: PORT,
            platform: process.platform
        }
    });
});

app.post('/api/cron/trigger', async (req, res) => {
    try {
        console.log('Manual trigger initiated');
        
        // Generate content
        const topic = 'Building wealth through automation and smart systems';
        const content = generateTestContent(topic);
        
        console.log('Content generated successfully:', content.topic);
        
        res.json({
            success: true,
            content: content,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Manual trigger failed:', error.message);
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
    console.log(`WealthAutomationHQ backend listening on port ${PORT}`);
    console.log(`Dashboard available at: http://localhost:${PORT}/dashboard`);
    console.log('Simple test mode active - ready for content generation');
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


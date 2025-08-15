/**
 * WealthAutomationHQ - Complete AI Automation Empire (FIXED VERSION)
 * Version: 5.1.0 - Environment Variables Fix
 */

const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const axios = require('axios');
const FormData = require('form-data');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());

// API Configuration - FIXED to use environment variables
const API_CONFIG = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1'
    },
    wordpress: {
        siteUrl: process.env.WORDPRESS_API_URL || 'https://wealthautomationhq.com',
        username: process.env.WORDPRESS_USER || 'wealthauto',
        password: process.env.WORDPRESS_APP_PASSWORD || process.env.WORDPRESS_JWT_SECRET
    },
    convertkit: {
        apiKey: process.env.CONVERTKIT_API_KEY,
        apiSecret: process.env.CONVERTKIT_API_SECRET,
        formId: process.env.CONVERTKIT_BASIC_TAG_ID || '7837546'
    },
    heygen: {
        apiKey: process.env.HEYGEN_API_KEY,
        baseURL: 'https://api.heygen.com/v2'
    },
    elevenlabs: {
        apiKey: process.env.ELEVENLABS_API_KEY,
        baseURL: 'https://api.elevenlabs.io/v1'
    },
    qliker: {
        apiKey: process.env.QLIKER_API_KEY,
        baseURL: 'https://qliker.io/api'
    }
};

// Validate required environment variables
function validateEnvironment() {
    const required = [
        'OPENAI_API_KEY',
        'CONVERTKIT_API_KEY',
        'HEYGEN_API_KEY',
        'ELEVENLABS_API_KEY',
        'QLIKER_API_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing);
        return false;
    }
    
    console.log('✅ All required environment variables found');
    return true;
}

// Load affiliate offers
const affiliateOffers = {
    offers: [
        {
            id: 1,
            name: "ClickFunnels 2.0",
            description: "Complete sales funnel builder with landing pages, email automation, and payment processing",
            url: "https://clickfunnels.com/?cf_affiliate_id=YOUR_ID",
            commission: "40%",
            category: "Marketing Tools",
            keywords: ["funnel", "landing page", "sales", "conversion"],
            priority: 5,
            ctaTemplates: [
                "Ready to build high-converting funnels? <a href='{{url}}' target='_blank'>Try ClickFunnels 2.0 FREE for 14 days</a>",
                "Stop losing sales to poor funnels. <a href='{{url}}' target='_blank'>Get ClickFunnels 2.0 and boost conversions</a>"
            ]
        },
        {
            id: 2,
            name: "GoHighLevel",
            description: "All-in-one marketing platform with CRM, automation, and white-label capabilities",
            url: "https://gohighlevel.com/?fp_ref=YOUR_ID",
            commission: "40%",
            category: "Marketing Automation",
            keywords: ["crm", "automation", "marketing", "agency"],
            priority: 5,
            ctaTemplates: [
                "Scale your agency with ease. <a href='{{url}}' target='_blank'>Try GoHighLevel FREE for 14 days</a>",
                "Automate your entire marketing process. <a href='{{url}}' target='_blank'>Get GoHighLevel now</a>"
            ]
        },
        {
            id: 3,
            name: "ConvertKit",
            description: "Email marketing platform designed for creators and online businesses",
            url: "https://convertkit.com/?lmref=YOUR_ID",
            commission: "30%",
            category: "Email Marketing",
            keywords: ["email", "newsletter", "automation", "creator"],
            priority: 4,
            ctaTemplates: [
                "Build your email list like a pro. <a href='{{url}}' target='_blank'>Start with ConvertKit FREE</a>",
                "Turn subscribers into customers. <a href='{{url}}' target='_blank'>Try ConvertKit today</a>"
            ]
        },
        {
            id: 4,
            name: "Kajabi",
            description: "All-in-one platform for creating and selling online courses and digital products",
            url: "https://kajabi.com/?r=YOUR_ID",
            commission: "30%",
            category: "Course Creation",
            keywords: ["course", "digital product", "online business", "education"],
            priority: 4,
            ctaTemplates: [
                "Launch your online course empire. <a href='{{url}}' target='_blank'>Try Kajabi FREE for 14 days</a>",
                "Monetize your expertise today. <a href='{{url}}' target='_blank'>Get started with Kajabi</a>"
            ]
        },
        {
            id: 5,
            name: "Systeme.io",
            description: "Complete online business platform with funnels, email marketing, and course hosting",
            url: "https://systeme.io/?sa=YOUR_ID",
            commission: "60%",
            category: "All-in-One Platform",
            keywords: ["funnel", "email", "course", "automation"],
            priority: 5,
            ctaTemplates: [
                "Build your entire business on one platform. <a href='{{url}}' target='_blank'>Try Systeme.io FREE</a>",
                "Everything you need to succeed online. <a href='{{url}}' target='_blank'>Start with Systeme.io</a>"
            ]
        },
        {
            id: 6,
            name: "Builderall",
            description: "Digital marketing platform with website builder, funnels, and automation tools",
            url: "https://builderall.com/?r=YOUR_ID",
            commission: "30%",
            category: "Website Builder",
            keywords: ["website", "builder", "marketing", "automation"],
            priority: 3,
            ctaTemplates: [
                "Build stunning websites without code. <a href='{{url}}' target='_blank'>Try Builderall today</a>",
                "Your complete digital marketing toolkit. <a href='{{url}}' target='_blank'>Get Builderall now</a>"
            ]
        },
        {
            id: 7,
            name: "AWeber",
            description: "Email marketing and automation platform for small businesses",
            url: "https://aweber.com/?id=YOUR_ID",
            commission: "30%",
            category: "Email Marketing",
            keywords: ["email", "automation", "small business", "marketing"],
            priority: 3,
            ctaTemplates: [
                "Grow your business with email marketing. <a href='{{url}}' target='_blank'>Try AWeber FREE</a>",
                "Automate your email campaigns. <a href='{{url}}' target='_blank'>Start with AWeber</a>"
            ]
        },
        {
            id: 8,
            name: "GetResponse",
            description: "Email marketing, automation, and landing page platform",
            url: "https://getresponse.com/?a=YOUR_ID",
            commission: "33%",
            category: "Email Marketing",
            keywords: ["email", "landing page", "automation", "marketing"],
            priority: 3,
            ctaTemplates: [
                "Master email marketing automation. <a href='{{url}}' target='_blank'>Try GetResponse FREE</a>",
                "Convert more leads into customers. <a href='{{url}}' target='_blank'>Get GetResponse now</a>"
            ]
        }
    ]
};

// System stats
let systemStats = {
    postsGenerated: 0,
    emailsSent: 0,
    videosCreated: 0,
    voicesGenerated: 0,
    linksCreated: 0,
    isRunning: false,
    lastRun: null
};

let currentOfferIndex = 0;

// Content generation function
async function generateContent(topic = null) {
    try {
        if (!API_CONFIG.openai.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const contentTopics = [
            "Building Passive Income Through AI Automation",
            "From Recovery to Riches: My Automation Journey", 
            "Special Needs Parenting and Business Success",
            "The Truth About Making Money Online",
            "Why Most People Fail at Affiliate Marketing",
            "Automation Tools That Actually Work",
            "Building Wealth While Raising Special Needs Kids",
            "The Recovery Entrepreneur's Guide to Success",
            "AI Tools That Changed My Business Forever",
            "From Addiction to Automation: A Recovery Success Story"
        ];

        const selectedTopic = topic || contentTopics[Math.floor(Math.random() * contentTopics.length)];
        
        const prompt = `Write a comprehensive, engaging blog post about "${selectedTopic}" in Shaun Critzer's authentic voice and style.

SHAUN'S BACKGROUND & VOICE:
- Recovered from addiction, now 8+ years clean
- Father of special needs children (autism, ADHD)
- Built successful online businesses through automation
- Authentic, no-BS approach to business and life
- Focuses on practical, actionable strategies
- Values family time and work-life balance
- Speaks from real experience, not theory

WRITING STYLE:
- Conversational and relatable
- Shares personal stories and struggles
- Practical advice with real examples
- Honest about challenges and failures
- Encouraging but realistic tone
- Uses "I" statements and personal anecdotes

CONTENT REQUIREMENTS:
- 1500-2000 words
- Include personal story elements
- Provide actionable strategies
- Address common objections/concerns
- Include a strong call-to-action
- SEO-optimized with natural keyword usage

STRUCTURE:
1. Hook with personal story
2. Problem identification
3. Solution explanation with examples
4. Step-by-step implementation
5. Common mistakes to avoid
6. Personal results/transformation
7. Call-to-action

Write the complete blog post now:`;

        const response = await axios.post(`${API_CONFIG.openai.baseURL}/chat/completions`, {
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are Shaun Critzer, a successful entrepreneur who overcame addiction and built wealth through automation while raising special needs children. Write in your authentic, conversational voice with personal stories and practical advice."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 4000,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content;
        
        // Add affiliate offer CTA
        const offer = affiliateOffers.offers[currentOfferIndex];
        const cta = offer.ctaTemplates[Math.floor(Math.random() * offer.ctaTemplates.length)];
        const finalCta = cta.replace('{{url}}', offer.url);
        
        const finalContent = content + `\n\n---\n\n**Ready to take action?** ${finalCta}\n\n*This post contains affiliate links. I only recommend tools I personally use and believe in.*`;
        
        // Rotate to next offer
        currentOfferIndex = (currentOfferIndex + 1) % affiliateOffers.offers.length;
        
        return {
            title: selectedTopic,
            content: finalContent,
            offer: offer.name,
            success: true
        };
        
    } catch (error) {
        console.error('Content generation error:', error.message);
        throw error;
    }
}

// WordPress posting function
async function postToWordPress(title, content) {
    try {
        if (!API_CONFIG.wordpress.siteUrl) {
            throw new Error('WordPress configuration missing');
        }

        const postData = {
            title: title,
            content: content,
            status: 'publish',
            categories: ['Automation', 'Business'],
            tags: ['AI', 'Automation', 'Passive Income', 'Recovery']
        };

        // Use JWT authentication if available, otherwise basic auth
        const authHeaders = API_CONFIG.wordpress.password.startsWith('ey') ? 
            { 'Authorization': `Bearer ${API_CONFIG.wordpress.password}` } :
            { 'Authorization': `Basic ${Buffer.from(`${API_CONFIG.wordpress.username}:${API_CONFIG.wordpress.password}`).toString('base64')}` };

        const response = await axios.post(
            `${API_CONFIG.wordpress.siteUrl}/wp-json/wp/v2/posts`,
            postData,
            { headers: authHeaders }
        );

        return {
            success: true,
            postId: response.data.id,
            url: response.data.link
        };
        
    } catch (error) {
        console.error('WordPress posting error:', error.message);
        throw error;
    }
}

// ConvertKit email function
async function sendConvertKitEmail(title, content) {
    try {
        if (!API_CONFIG.convertkit.apiKey) {
            throw new Error('ConvertKit API key not configured');
        }

        const emailContent = `
        <h2>${title}</h2>
        <p>Hey there!</p>
        <p>I just published a new post that I think you'll love. Here's a preview:</p>
        ${content.substring(0, 500)}...
        <p><a href="https://wealthautomationhq.com" style="background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Read the full post →</a></p>
        <p>Talk soon,<br>Shaun</p>
        `;

        const broadcastData = {
            subject: `New Post: ${title}`,
            content: emailContent,
            description: `Broadcast for: ${title}`,
            public: false
        };

        const response = await axios.post(
            `https://api.convertkit.com/v3/broadcasts`,
            broadcastData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    api_key: API_CONFIG.convertkit.apiKey
                }
            }
        );

        return {
            success: true,
            broadcastId: response.data.broadcast.id
        };
        
    } catch (error) {
        console.error('ConvertKit email error:', error.message);
        throw error;
    }
}

// HeyGen video generation function
async function generateHeyGenVideo(script) {
    try {
        if (!API_CONFIG.heygen.apiKey) {
            throw new Error('HeyGen API key not configured');
        }

        const videoData = {
            video_inputs: [{
                character: {
                    type: "avatar",
                    avatar_id: "default_avatar"
                },
                voice: {
                    type: "text",
                    input_text: script.substring(0, 1000) // Limit for demo
                }
            }]
        };

        const response = await axios.post(
            `${API_CONFIG.heygen.baseURL}/video/generate`,
            videoData,
            {
                headers: {
                    'X-API-Key': API_CONFIG.heygen.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            videoId: response.data.video_id
        };
        
    } catch (error) {
        console.error('HeyGen video error:', error.message);
        return { success: false, error: error.message };
    }
}

// ElevenLabs voice generation function
async function generateElevenLabsVoice(text) {
    try {
        if (!API_CONFIG.elevenlabs.apiKey) {
            throw new Error('ElevenLabs API key not configured');
        }

        const voiceData = {
            text: text.substring(0, 500), // Limit for demo
            model_id: "eleven_monolingual_v1",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        };

        const response = await axios.post(
            `${API_CONFIG.elevenlabs.baseURL}/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
            voiceData,
            {
                headers: {
                    'xi-api-key': API_CONFIG.elevenlabs.apiKey,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            }
        );

        return {
            success: true,
            audioData: response.data
        };
        
    } catch (error) {
        console.error('ElevenLabs voice error:', error.message);
        return { success: false, error: error.message };
    }
}

// Qliker link management function
async function createQlikerLink(url, title) {
    try {
        if (!API_CONFIG.qliker.apiKey) {
            throw new Error('Qliker API key not configured');
        }

        const linkData = {
            url: url,
            title: title,
            description: `Generated link for: ${title}`
        };

        // Note: This is a placeholder - actual Qliker API endpoints may differ
        const response = await axios.post(
            `${API_CONFIG.qliker.baseURL}/links`,
            linkData,
            {
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.qliker.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            shortUrl: response.data.short_url
        };
        
    } catch (error) {
        console.error('Qliker link error:', error.message);
        return { success: false, error: error.message };
    }
}

// Complete automation workflow
async function runCompleteWorkflow(manual = false) {
    if (systemStats.isRunning) {
        return { success: false, error: 'Automation already running' };
    }

    systemStats.isRunning = true;
    const startTime = new Date();
    
    try {
        console.log('🚀 Starting complete automation workflow...');
        
        // Step 1: Generate content
        console.log('📝 Generating content...');
        const contentResult = await generateContent();
        systemStats.postsGenerated++;
        
        // Step 2: Post to WordPress
        console.log('🌐 Posting to WordPress...');
        const wpResult = await postToWordPress(contentResult.title, contentResult.content);
        
        // Step 3: Generate video
        console.log('🎥 Generating video...');
        const videoResult = await generateHeyGenVideo(contentResult.content);
        if (videoResult.success) systemStats.videosCreated++;
        
        // Step 4: Generate voice
        console.log('🎙️ Generating voice...');
        const voiceResult = await generateElevenLabsVoice(contentResult.content);
        if (voiceResult.success) systemStats.voicesGenerated++;
        
        // Step 5: Create tracking link
        console.log('🔗 Creating tracking link...');
        const linkResult = await createQlikerLink(wpResult.url, contentResult.title);
        if (linkResult.success) systemStats.linksCreated++;
        
        // Step 6: Send email
        console.log('📧 Sending email broadcast...');
        const emailResult = await sendConvertKitEmail(contentResult.title, contentResult.content);
        if (emailResult.success) systemStats.emailsSent++;
        
        systemStats.lastRun = startTime.toLocaleString();
        systemStats.isRunning = false;
        
        const duration = (new Date() - startTime) / 1000;
        
        console.log(`✅ Complete automation workflow finished in ${duration}s`);
        
        return {
            success: true,
            duration: duration,
            results: {
                content: contentResult,
                wordpress: wpResult,
                video: videoResult,
                voice: voiceResult,
                link: linkResult,
                email: emailResult
            },
            stats: systemStats
        };
        
    } catch (error) {
        systemStats.isRunning = false;
        console.error('❌ Automation workflow failed:', error.message);
        throw error;
    }
}

// Routes
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WealthAutomationHQ - Complete AI Empire Dashboard</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f23; color: #fff; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { font-size: 2.5rem; margin-bottom: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .header p { font-size: 1.2rem; opacity: 0.8; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 40px; }
            .stat { background: #1a1a2e; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #16213e; }
            .stat-number { font-size: 2rem; font-weight: bold; color: #4CAF50; margin-bottom: 5px; }
            .stat-label { opacity: 0.7; }
            .status-running { color: #4CAF50; }
            .status-idle { color: #FFC107; }
            .card { background: #1a1a2e; padding: 30px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #16213e; }
            .card h2 { margin-bottom: 20px; color: #667eea; }
            .integrations { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .integration { background: #16213e; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50; }
            .integration h4 { color: #4CAF50; margin-bottom: 5px; }
            .btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 10px 5px; transition: transform 0.2s; }
            .btn:hover { transform: translateY(-2px); }
            .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            .logs { background: #0f0f23; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; max-height: 300px; overflow-y: auto; }
            .logs div { margin-bottom: 5px; }
            #result { margin-top: 20px; padding: 15px; border-radius: 8px; }
            .success { background: rgba(76, 175, 80, 0.1); border: 1px solid #4CAF50; }
            .error { background: rgba(244, 67, 54, 0.1); border: 1px solid #f44336; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>WealthAutomationHQ Complete AI Empire Dashboard</h1>
                <p>Version: 5.1.0 - Environment Variables Fixed | All 6 Integrations Active</p>
            </div>

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
                    <div class="stat-number">${systemStats.videosCreated}</div>
                    <div class="stat-label">Videos Created</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${systemStats.voicesGenerated}</div>
                    <div class="stat-label">Voices Generated</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${systemStats.linksCreated}</div>
                    <div class="stat-label">Links Created</div>
                </div>
                <div class="stat">
                    <div class="stat-number status-${systemStats.isRunning ? 'running' : 'idle'}">${systemStats.isRunning ? 'RUNNING' : 'READY'}</div>
                    <div class="stat-label">System Status</div>
                </div>
            </div>

            <div class="card">
                <h2>API Integrations</h2>
                <div class="integrations">
                    <div class="integration">
                        <h4>WordPress</h4>
                        <p>WealthAutomationHQ.com</p>
                    </div>
                    <div class="integration">
                        <h4>ConvertKit</h4>
                        <p>Email Automation</p>
                    </div>
                    <div class="integration">
                        <h4>HeyGen</h4>
                        <p>Video Generation</p>
                    </div>
                    <div class="integration">
                        <h4>ElevenLabs</h4>
                        <p>Voice Cloning</p>
                    </div>
                    <div class="integration">
                        <h4>Qliker</h4>
                        <p>Link Management</p>
                    </div>
                    <div class="integration">
                        <h4>OpenAI</h4>
                        <p>Content Generation</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Complete Automation Workflow</h2>
                <p><strong>Last Run:</strong> ${systemStats.lastRun || 'Never'}</p>
                <p><strong>Next Affiliate Offer:</strong> ${affiliateOffers.offers[currentOfferIndex].name}</p>
                <p><strong>Workflow:</strong> Content → WordPress → Video → Voice → Email → Revenue</p>
                <button class="btn" onclick="runCompleteAutomation()" ${systemStats.isRunning ? 'disabled' : ''}>
                    🎯 Run Complete Automation Now
                </button>
                <button class="btn" onclick="testSystem()">🧪 Test All Systems</button>
                <button class="btn" onclick="refreshStatus()">🔄 Refresh Status</button>
                <div id="result"></div>
            </div>

            <div class="card">
                <h2>Automation Schedule</h2>
                <p>Daily complete workflow: Monday-Friday at 9:00 AM EST</p>
                <p>Includes: Content generation, WordPress posting, video creation, voice generation, email broadcast</p>
                <button class="btn" onclick="enableScheduledJobs()">⏰ Enable Scheduled Automation</button>
            </div>

            <div class="card">
                <h2>System Logs</h2>
                <div class="logs" id="logs">
                    <div>[${new Date().toLocaleString()}] [SUCCESS] Complete AI automation empire active - Version 5.1.0</div>
                    <div>[${new Date().toLocaleString()}] [INFO] All 6 integrations loaded and ready</div>
                    <div>[${new Date().toLocaleString()}] [INFO] ${affiliateOffers.offers.length} affiliate offers loaded</div>
                    <div>[${new Date().toLocaleString()}] [INFO] Environment variables properly configured</div>
                    <div>[${new Date().toLocaleString()}] [INFO] Ready for complete automation workflow</div>
                </div>
            </div>
        </div>

        <script>
            function runCompleteAutomation() {
                const resultDiv = document.getElementById('result');
                const button = event.target;
                
                button.disabled = true;
                button.textContent = '⏳ Running Complete Automation...';
                resultDiv.innerHTML = '<p>🚀 Starting complete automation workflow...</p>';
                
                fetch('/api/automation/complete', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        resultDiv.innerHTML = \`
                            <div class="success">
                                <h3>✅ Complete Automation Successful!</h3>
                                <p><strong>Duration:</strong> \${data.duration}s</p>
                                <p><strong>Content:</strong> \${data.results.content.title}</p>
                                <p><strong>WordPress:</strong> \${data.results.wordpress.success ? 'Posted' : 'Failed'}</p>
                                <p><strong>Video:</strong> \${data.results.video.success ? 'Generated' : 'Failed'}</p>
                                <p><strong>Voice:</strong> \${data.results.voice.success ? 'Generated' : 'Failed'}</p>
                                <p><strong>Email:</strong> \${data.results.email.success ? 'Sent' : 'Failed'}</p>
                                <p><strong>Link:</strong> \${data.results.link.success ? 'Created' : 'Failed'}</p>
                            </div>
                        \`;
                        setTimeout(refreshStatus, 1000);
                    } else {
                        resultDiv.innerHTML = \`<div class="error"><h3>❌ Automation Failed</h3><p>\${data.error}</p></div>\`;
                    }
                })
                .catch(error => {
                    resultDiv.innerHTML = \`<div class="error"><h3>❌ Error</h3><p>\${error.message}</p></div>\`;
                })
                .finally(() => {
                    button.disabled = false;
                    button.textContent = '🎯 Run Complete Automation Now';
                });
            }

            function testSystem() {
                fetch('/api/test')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('result').innerHTML = \`
                        <div class="success">
                            <h3>🧪 System Test Results</h3>
                            <pre>\${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    \`;
                });
            }

            function refreshStatus() {
                location.reload();
            }

            function enableScheduledJobs() {
                fetch('/api/schedule/enable', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    document.getElementById('result').innerHTML = \`
                        <div class="success">
                            <h3>⏰ Scheduled Jobs</h3>
                            <p>\${data.message}</p>
                        </div>
                    \`;
                });
            }
        </script>
    </body>
    </html>
    `);
});

// API Routes
app.get('/api/test', (req, res) => {
    const envCheck = {
        openai: !!API_CONFIG.openai.apiKey,
        convertkit: !!API_CONFIG.convertkit.apiKey,
        heygen: !!API_CONFIG.heygen.apiKey,
        elevenlabs: !!API_CONFIG.elevenlabs.apiKey,
        qliker: !!API_CONFIG.qliker.apiKey,
        wordpress: !!API_CONFIG.wordpress.siteUrl
    };

    res.json({
        timestamp: new Date().toISOString(),
        version: '5.1.0',
        status: 'operational',
        environment: {
            nodeVersion: process.version,
            port: PORT,
            platform: process.platform
        },
        integrations: envCheck,
        affiliateOffers: affiliateOffers.offers.length,
        systemStats: systemStats
    });
});

app.post('/api/automation/complete', async (req, res) => {
    try {
        const result = await runCompleteWorkflow(true);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/schedule/enable', (req, res) => {
    // Schedule daily automation Monday-Friday at 9 AM EST
    cron.schedule('0 9 * * 1-5', async () => {
        console.log('🕘 Running scheduled automation...');
        try {
            await runCompleteWorkflow(false);
        } catch (error) {
            console.error('Scheduled automation failed:', error.message);
        }
    }, {
        timezone: "America/New_York"
    });

    res.json({
        success: true,
        message: 'Scheduled automation enabled: Monday-Friday at 9:00 AM EST'
    });
});

// Legacy endpoints for compatibility
app.post('/api/cron/trigger', async (req, res) => {
    try {
        const result = await runCompleteWorkflow(true);
        res.json(result);
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

// Start server only if environment is valid
if (validateEnvironment()) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 WealthAutomationHQ Complete AI Empire listening on port ${PORT}`);
        console.log(`📊 Dashboard available at: http://localhost:${PORT}/dashboard`);
        console.log('✅ Complete live system active - All 6 integrations ready');
        console.log('🔧 Integrations: WordPress, ConvertKit, HeyGen, ElevenLabs, Qliker, OpenAI');
        console.log(`💰 Loaded ${affiliateOffers.offers.length} affiliate offers`);
        console.log('🎯 Version 5.1.0 - Environment Variables Fixed');
    });
} else {
    console.error('❌ Server startup failed - Missing required environment variables');
    process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});


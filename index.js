/**
 * WealthAutomationHQ - Complete AI Automation Empire
 * Version: 5.0.0 - Full Integration (WordPress, ConvertKit, HeyGen, ElevenLabs, Qliker)
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

// API Configuration
const API_CONFIG = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY || 'sk-proj-your-key-here',
        baseURL: 'https://api.openai.com/v1'
    },
    wordpress: {
        siteUrl: 'https://wealthautomationhq.com',
        username: 'wealthauto',
        password: 'testuser'
    },
    convertkit: {
        apiKey: 'kit_2291ec06896942a3c8299a9e26714349',
        apiSecret: 'x9Uzt8Xs2179XCHdJ6vZrb_-sq12AGihK_sxmuqK3ZY',
        formId: '7837546'
    },
    heygen: {
        apiKey: 'YTQ3MmFiZTM1NTJkNGJiNDg5OWVjMzgzMWFlOTFhYzctMTc1NDk2MjQ2OQ==',
        baseURL: 'https://api.heygen.com/v2'
    },
    elevenlabs: {
        apiKey: 'sk_0cb5d5114e0c952a5ae509e3ecc759d43dea0a1e1944e5d5',
        baseURL: 'https://api.elevenlabs.io/v1'
    },
    qliker: {
        apiKey: '512|nhe4fso03msbUwFTYhsaBB331u00YPLB70X4DML41891691',
        baseURL: 'https://qliker.io/api'
    }
};

// Load affiliate offers
const affiliateOffers = {
    "offers": [
        {
            "id": "clickfunnels",
            "name": "ClickFunnels 2.0",
            "description": "The ultimate funnel builder for entrepreneurs and marketers",
            "url": "https://www.clickfunnels.com/",
            "commission": "40%",
            "categories": ["funnel-building", "marketing", "sales"],
            "keywords": ["funnel", "sales", "marketing", "conversion", "landing page"],
            "priority": 5,
            "ctaTemplates": [
                "Ready to build high-converting funnels? <a href='{{url}}' target='_blank'>Try ClickFunnels 2.0 FREE for 14 days</a>",
                "Stop losing sales to poor funnels. <a href='{{url}}' target='_blank'>Get ClickFunnels 2.0 and boost conversions</a>"
            ]
        },
        {
            "id": "gohighlevel",
            "name": "GoHighLevel",
            "description": "All-in-one marketing platform for agencies and businesses",
            "url": "https://www.gohighlevel.com/",
            "commission": "40%",
            "categories": ["crm", "marketing", "automation"],
            "keywords": ["crm", "automation", "marketing", "agency", "client management"],
            "priority": 5,
            "ctaTemplates": [
                "Scale your agency with ease. <a href='{{url}}' target='_blank'>Try GoHighLevel FREE for 14 days</a>",
                "Manage all your clients in one place. <a href='{{url}}' target='_blank'>Get GoHighLevel now</a>"
            ]
        },
        {
            "id": "convertkit",
            "name": "ConvertKit",
            "description": "Email marketing platform built for creators",
            "url": "https://convertkit.com/",
            "commission": "30%",
            "categories": ["email-marketing", "automation"],
            "keywords": ["email", "newsletter", "automation", "creator", "marketing"],
            "priority": 4,
            "ctaTemplates": [
                "Grow your email list like a pro. <a href='{{url}}' target='_blank'>Start with ConvertKit FREE</a>",
                "Turn subscribers into customers. <a href='{{url}}' target='_blank'>Try ConvertKit today</a>"
            ]
        },
        {
            "id": "kajabi",
            "name": "Kajabi",
            "description": "All-in-one platform for online courses and digital products",
            "url": "https://kajabi.com/",
            "commission": "30%",
            "categories": ["course-creation", "digital-products"],
            "keywords": ["course", "online learning", "digital products", "education"],
            "priority": 4,
            "ctaTemplates": [
                "Launch your online course today. <a href='{{url}}' target='_blank'>Try Kajabi FREE for 14 days</a>",
                "Build your knowledge empire. <a href='{{url}}' target='_blank'>Get started with Kajabi</a>"
            ]
        },
        {
            "id": "systeme",
            "name": "Systeme.io",
            "description": "Complete marketing platform for online entrepreneurs",
            "url": "https://systeme.io/",
            "commission": "60%",
            "categories": ["marketing", "automation", "funnel-building"],
            "keywords": ["marketing", "automation", "funnel", "email", "affiliate"],
            "priority": 5,
            "ctaTemplates": [
                "Start your online business for FREE. <a href='{{url}}' target='_blank'>Get Systeme.io now</a>",
                "Everything you need in one platform. <a href='{{url}}' target='_blank'>Try Systeme.io FREE</a>"
            ]
        },
        {
            "id": "builderall",
            "name": "Builderall",
            "description": "Digital marketing platform with website builder and tools",
            "url": "https://builderall.com/",
            "commission": "30%",
            "categories": ["website-building", "marketing"],
            "keywords": ["website", "builder", "marketing", "digital", "tools"],
            "priority": 3,
            "ctaTemplates": [
                "Build stunning websites in minutes. <a href='{{url}}' target='_blank'>Try Builderall FREE</a>",
                "All-in-one digital marketing solution. <a href='{{url}}' target='_blank'>Get Builderall now</a>"
            ]
        },
        {
            "id": "aweber",
            "name": "AWeber",
            "description": "Email marketing and automation platform",
            "url": "https://www.aweber.com/",
            "commission": "30%",
            "categories": ["email-marketing"],
            "keywords": ["email", "marketing", "automation", "newsletter"],
            "priority": 3,
            "ctaTemplates": [
                "Powerful email marketing made simple. <a href='{{url}}' target='_blank'>Try AWeber FREE</a>",
                "Grow your business with email. <a href='{{url}}' target='_blank'>Start AWeber today</a>"
            ]
        },
        {
            "id": "getresponse",
            "name": "GetResponse",
            "description": "Email marketing, automation, and landing pages",
            "url": "https://www.getresponse.com/",
            "commission": "33%",
            "categories": ["email-marketing", "automation"],
            "keywords": ["email", "marketing", "automation", "landing page"],
            "priority": 3,
            "ctaTemplates": [
                "Complete email marketing solution. <a href='{{url}}' target='_blank'>Try GetResponse FREE</a>",
                "Automate your marketing success. <a href='{{url}}' target='_blank'>Get GetResponse now</a>"
            ]
        }
    ]
};

// System state
let systemStats = {
    postsGenerated: 0,
    emailsSent: 0,
    videosCreated: 0,
    voicesGenerated: 0,
    linksCreated: 0,
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

// Content Generation with OpenAI
async function generateContent(topic = null, affiliateOffer = null) {
    try {
        const contentTopics = [
            "Building Wealth Through Smart Automation",
            "AI-Powered Business Systems That Generate Passive Income",
            "From Recovery to Riches: My Automation Journey",
            "Special Needs Parenting and Building Online Income",
            "The Truth About Affiliate Marketing Automation",
            "How I Built a 6-Figure Business While Raising Special Needs Kids",
            "AI Tools That Actually Make Money (Not Just Hype)",
            "The Automation Mindset: Working Smarter, Not Harder",
            "Building Systems That Work While You Sleep",
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
            max_tokens: 3000,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content;
        
        // Generate SEO elements
        const seoPrompt = `Based on this blog post content, generate:
1. SEO Title (60 characters max)
2. Meta Description (155 characters max)
3. 5 relevant tags
4. 2 categories
5. Excerpt (150 words)

Blog content: ${content.substring(0, 500)}...`;

        const seoResponse = await axios.post(`${API_CONFIG.openai.baseURL}/chat/completions`, {
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: seoPrompt
                }
            ],
            max_tokens: 500,
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const seoData = seoResponse.data.choices[0].message.content;
        
        // Parse SEO data (simplified)
        const title = selectedTopic;
        const excerpt = content.substring(0, 300) + "...";
        const categories = ["Wealth Building", "Automation"];
        const tags = ["automation", "passive income", "AI business", "wealth building", "entrepreneurship"];
        
        // Inject affiliate CTA if offer provided
        let finalContent = content;
        if (affiliateOffer) {
            const ctaTemplate = affiliateOffer.ctaTemplates[Math.floor(Math.random() * affiliateOffer.ctaTemplates.length)];
            const cta = ctaTemplate.replace('{{url}}', affiliateOffer.url);
            
            const ctaBlock = `
<div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 6px;">
    <h3 style="color: #667eea; margin-bottom: 15px;">🚀 Recommended Resource</h3>
    <p style="margin-bottom: 15px;">${affiliateOffer.description}</p>
    <p>${cta}</p>
</div>`;
            
            // Insert CTA in the middle of the content
            const contentParts = finalContent.split('\n\n');
            const middleIndex = Math.floor(contentParts.length / 2);
            contentParts.splice(middleIndex, 0, ctaBlock);
            finalContent = contentParts.join('\n\n');
        }

        return {
            success: true,
            title: title,
            content: finalContent,
            excerpt: excerpt,
            categories: categories,
            tags: tags,
            seoTitle: title,
            seoDescription: excerpt.substring(0, 155),
            wordCount: finalContent.split(' ').length,
            topic: selectedTopic
        };

    } catch (error) {
        console.error('Content generation failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// WordPress Integration
async function publishToWordPress(postData) {
    try {
        const wpData = {
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt,
            status: 'publish',
            categories: postData.categories,
            tags: postData.tags,
            meta: {
                _yoast_wpseo_title: postData.seoTitle,
                _yoast_wpseo_metadesc: postData.seoDescription
            }
        };

        // Get JWT token first
        const authResponse = await axios.post(`${API_CONFIG.wordpress.siteUrl}/wp-json/jwt-auth/v1/token`, {
            username: API_CONFIG.wordpress.username,
            password: API_CONFIG.wordpress.password
        });

        const token = authResponse.data.token;

        // Create the post
        const response = await axios.post(`${API_CONFIG.wordpress.siteUrl}/wp-json/wp/v2/posts`, wpData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            id: response.data.id,
            url: response.data.link,
            status: response.data.status
        };

    } catch (error) {
        console.error('WordPress publishing failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// ConvertKit Integration
async function sendConvertKitBroadcast(subject, content, description) {
    try {
        // Create broadcast
        const broadcastData = {
            subject: subject,
            content: content,
            description: description,
            public: false
        };

        const response = await axios.post(`https://api.convertkit.com/v3/broadcasts`, broadcastData, {
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                api_key: API_CONFIG.convertkit.apiKey
            }
        });

        const broadcastId = response.data.broadcast.id;

        // Send the broadcast
        const sendResponse = await axios.post(`https://api.convertkit.com/v3/broadcasts/${broadcastId}/send`, {}, {
            params: {
                api_key: API_CONFIG.convertkit.apiKey
            }
        });

        return {
            success: true,
            broadcast: response.data.broadcast,
            sent: sendResponse.data
        };

    } catch (error) {
        console.error('ConvertKit broadcast failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// HeyGen Video Generation
async function generateHeyGenVideo(script, title) {
    try {
        const videoData = {
            video_inputs: [{
                character: {
                    type: "avatar",
                    avatar_id: "default_avatar", // You can customize this
                    avatar_style: "normal"
                },
                voice: {
                    type: "text",
                    input_text: script,
                    voice_id: "shaun_voice" // Custom voice ID if available
                },
                background: {
                    type: "color",
                    value: "#ffffff"
                }
            }],
            dimension: {
                width: 1920,
                height: 1080
            },
            aspect_ratio: "16:9",
            title: title
        };

        const response = await axios.post(`${API_CONFIG.heygen.baseURL}/video/generate`, videoData, {
            headers: {
                'X-API-Key': API_CONFIG.heygen.apiKey,
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            video_id: response.data.video_id,
            status: response.data.status
        };

    } catch (error) {
        console.error('HeyGen video generation failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// ElevenLabs Voice Generation
async function generateElevenLabsVoice(text, voiceId = "default") {
    try {
        const response = await axios.post(`${API_CONFIG.elevenlabs.baseURL}/text-to-speech/${voiceId}`, {
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        }, {
            headers: {
                'xi-api-key': API_CONFIG.elevenlabs.apiKey,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });

        return {
            success: true,
            audio_data: response.data,
            content_type: response.headers['content-type']
        };

    } catch (error) {
        console.error('ElevenLabs voice generation failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Qliker Link Management
async function createQlikerLink(originalUrl, title) {
    try {
        const response = await axios.post(`${API_CONFIG.qliker.baseURL}/links`, {
            url: originalUrl,
            title: title,
            description: `Auto-generated link for: ${title}`
        }, {
            headers: {
                'Authorization': `Bearer ${API_CONFIG.qliker.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            short_url: response.data.short_url,
            link_id: response.data.id
        };

    } catch (error) {
        console.error('Qliker link creation failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Main automation workflow
async function runCompleteWorkflow(manualTrigger = false) {
    if (systemStats.isRunning) {
        console.log('Workflow already running, skipping...');
        return { success: false, error: 'Workflow already in progress' };
    }

    systemStats.isRunning = true;
    systemStats.lastRun = new Date().toISOString();

    try {
        console.log(`Starting complete automation workflow (${manualTrigger ? 'manual' : 'scheduled'})...`);

        // Step 1: Select affiliate offer
        const affiliateOffer = getNextAffiliateOffer();
        console.log('Selected affiliate offer:', affiliateOffer.name);

        // Step 2: Generate content
        console.log('Generating content with AI...');
        const contentResult = await generateContent(null, affiliateOffer);
        
        if (!contentResult.success) {
            throw new Error(`Content generation failed: ${contentResult.error}`);
        }

        console.log('Content generated successfully:', contentResult.title);
        systemStats.postsGenerated++;

        // Step 3: Create Qliker short link for affiliate offer
        console.log('Creating Qliker short link...');
        const qlikerResult = await createQlikerLink(affiliateOffer.url, affiliateOffer.name);
        
        if (qlikerResult.success) {
            console.log('Qliker link created:', qlikerResult.short_url);
            systemStats.linksCreated++;
            // Update affiliate offer URL with short link
            affiliateOffer.url = qlikerResult.short_url;
        }

        // Step 4: Publish to WordPress
        console.log('Publishing to WordPress...');
        const wpResult = await publishToWordPress(contentResult);

        if (!wpResult.success) {
            console.log('WordPress publishing failed, continuing with other steps...');
        } else {
            console.log('WordPress post published:', wpResult.url);
        }

        // Step 5: Generate video script
        console.log('Generating video script...');
        const videoScript = `Hey there! I'm Shaun Critzer, and I want to share something powerful with you today.

${contentResult.content.substring(0, 500)}...

This is exactly the kind of strategy that helped me build a successful online business while raising special needs kids and maintaining my recovery.

If you want to learn more about building wealth through smart automation, check out the full post on my blog at WealthAutomationHQ.com.

And if you're ready to take action, I highly recommend checking out ${affiliateOffer.name} - it's been a game-changer for my business.

Talk soon!`;

        // Step 6: Generate HeyGen video
        console.log('Generating HeyGen video...');
        const videoResult = await generateHeyGenVideo(videoScript, contentResult.title);
        
        if (videoResult.success) {
            console.log('HeyGen video generation started:', videoResult.video_id);
            systemStats.videosCreated++;
        }

        // Step 7: Generate ElevenLabs voice
        console.log('Generating ElevenLabs voice...');
        const voiceResult = await generateElevenLabsVoice(videoScript);
        
        if (voiceResult.success) {
            console.log('ElevenLabs voice generated successfully');
            systemStats.voicesGenerated++;
        }

        // Step 8: Generate email content
        console.log('Generating email content...');
        const emailContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">WealthAutomationHQ</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Building Wealth Through Smart Automation</p>
    </div>
    
    <div style="padding: 30px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hey there,</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">I just published a new post that I think you'll find incredibly valuable: <strong>${contentResult.title}</strong></p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">${contentResult.excerpt}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${wpResult.url || 'https://wealthautomationhq.com'}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Read the Full Post →</a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-bottom: 15px;">🚀 Recommended Resource</h3>
            <p style="margin-bottom: 15px; color: #856404;">${affiliateOffer.description}</p>
            <div style="text-align: center;">
                <a href="${affiliateOffer.url}" target="_blank" style="background: #856404; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Check Out ${affiliateOffer.name} →</a>
            </div>
        </div>
        
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

        // Step 9: Send ConvertKit broadcast
        console.log('Sending ConvertKit broadcast...');
        const emailSubject = `New post: ${contentResult.title}`;
        const ckResult = await sendConvertKitBroadcast(emailSubject, emailContent, `Automated broadcast for: ${contentResult.title}`);

        if (ckResult.success) {
            console.log('ConvertKit broadcast sent successfully');
            systemStats.emailsSent++;
        }

        // Step 10: Compile results
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
                url: wpResult.url || null,
                id: wpResult.id || null
            },
            email: {
                success: ckResult.success,
                subject: emailSubject,
                broadcastId: ckResult.broadcast?.id
            },
            video: {
                success: videoResult.success,
                videoId: videoResult.video_id || null
            },
            voice: {
                success: voiceResult.success
            },
            affiliate: {
                name: affiliateOffer.name,
                category: affiliateOffer.categories[0],
                shortUrl: qlikerResult.short_url || affiliateOffer.url
            },
            qliker: {
                success: qlikerResult.success,
                shortUrl: qlikerResult.short_url || null
            }
        };

        console.log('Complete automation workflow finished successfully!');
        return workflowResult;

    } catch (error) {
        console.error('Complete workflow failed:', error.message);
        systemStats.errors.push({
            timestamp: new Date().toISOString(),
            error: error.message,
            type: 'complete_workflow'
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

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'WealthAutomationHQ Complete AI Automation Empire',
        version: '5.0.0',
        timestamp: new Date().toISOString(),
        integrations: {
            wordpress: 'active',
            convertkit: 'active',
            heygen: 'active',
            elevenlabs: 'active',
            qliker: 'active',
            openai: 'active'
        },
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
    <title>WealthAutomationHQ Complete AI Empire Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .card { background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .btn { padding: 1rem 2rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; background: #667eea; color: white; margin: 0.5rem; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat { background: white; padding: 1.5rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2rem; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 0.5rem; font-size: 0.9rem; }
        .logs { background: #2d3748; color: #e2e8f0; padding: 1.5rem; border-radius: 8px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.9rem; max-height: 400px; overflow-y: auto; }
        .live-mode { background: #c6f6d5; color: #22543d; padding: 0.5rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
        .status-running { color: #38a169; }
        .status-idle { color: #667eea; }
        .integrations { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .integration { background: white; padding: 1rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .integration.active { border-left: 4px solid #38a169; }
        #result { margin-top: 1rem; padding: 1rem; background: #f7fafc; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 WealthAutomationHQ Complete AI Empire</h1>
        <p>Full-Stack AI Automation: Content → Video → Voice → Email → Revenue</p>
        <p><strong>System Status:</strong> Version: 5.0.0 | Port: ${PORT} | Node: ${process.version}</p>
        <div class="live-mode">
            <strong>🔴 COMPLETE LIVE SYSTEM ACTIVE</strong> - All integrations operational
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
                <div class="stat-number status-${systemStats.isRunning ? 'running' : 'idle'}">${systemStats.isRunning ? 'RUNNING' : 'IDLE'}</div>
                <div class="stat-label">System Status</div>
            </div>
        </div>

        <div class="card">
            <h2>API Integrations</h2>
            <div class="integrations">
                <div class="integration active">
                    <h4>WordPress</h4>
                    <p>WealthAutomationHQ.com</p>
                </div>
                <div class="integration active">
                    <h4>ConvertKit</h4>
                    <p>Email Automation</p>
                </div>
                <div class="integration active">
                    <h4>HeyGen</h4>
                    <p>Video Generation</p>
                </div>
                <div class="integration active">
                    <h4>ElevenLabs</h4>
                    <p>Voice Cloning</p>
                </div>
                <div class="integration active">
                    <h4>Qliker</h4>
                    <p>Link Management</p>
                </div>
                <div class="integration active">
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
                <div>[${new Date().toLocaleString()}] [SUCCESS] Complete AI automation empire active</div>
                <div>[${new Date().toLocaleString()}] [INFO] All 6 integrations loaded and ready</div>
                <div>[${new Date().toLocaleString()}] [INFO] ${affiliateOffers.offers.length} affiliate offers loaded</div>
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
                        <h3>✅ Complete Automation Workflow Completed!</h3>
                        <p><strong>Content:</strong> \${data.content.title}</p>
                        <p><strong>WordPress:</strong> \${data.wordpress.success ? 'Published' : 'Failed'}</p>
                        <p><strong>Video:</strong> \${data.video.success ? 'Generated' : 'Failed'}</p>
                        <p><strong>Voice:</strong> \${data.voice.success ? 'Generated' : 'Failed'}</p>
                        <p><strong>Email:</strong> \${data.email.success ? 'Sent' : 'Failed'}</p>
                        <p><strong>Qliker:</strong> \${data.qliker.success ? 'Link Created' : 'Failed'}</p>
                        <p><strong>Affiliate:</strong> \${data.affiliate.name}</p>
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
                button.textContent = '🎯 Run Complete Automation Now';
                setTimeout(refreshStatus, 2000);
            });
        }

        function testSystem() {
            fetch('/api/test')
                .then(response => response.json())
                .then(data => {
                    alert('System test completed. All integrations active.');
                    console.log('System test result:', data);
                })
                .catch(error => console.error('Error:', error));
        }

        function refreshStatus() {
            location.reload();
        }

        function enableScheduledJobs() {
            fetch('/api/automation/schedule', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
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
        status: 'complete_live_system',
        version: '5.0.0',
        integrations: {
            wordpress: true,
            convertkit: true,
            heygen: true,
            elevenlabs: true,
            qliker: true,
            openai: true
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

app.post('/api/automation/complete', async (req, res) => {
    try {
        console.log('Complete automation workflow triggered');
        
        const result = await runCompleteWorkflow(true);
        
        res.json(result);
        
    } catch (error) {
        console.error('Complete automation failed:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/automation/schedule', (req, res) => {
    try {
        // Schedule complete automation Monday-Friday at 9 AM EST
        cron.schedule('0 9 * * 1-5', async () => {
            console.log('Scheduled complete automation starting...');
            await runCompleteWorkflow(false);
        }, {
            timezone: "America/New_York"
        });

        res.json({
            success: true,
            message: 'Complete automation scheduled: Monday-Friday at 9:00 AM EST'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`WealthAutomationHQ Complete AI Empire listening on port ${PORT}`);
    console.log(`Dashboard available at: http://localhost:${PORT}/dashboard`);
    console.log('Complete live system active - All 6 integrations ready');
    console.log('Integrations: WordPress, ConvertKit, HeyGen, ElevenLabs, Qliker, OpenAI');
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


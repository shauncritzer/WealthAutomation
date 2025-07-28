/**
 * Content Generation Module for WealthAutomation
 * Generates AI-powered content using OpenAI API
 */

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class ContentGenerator {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.openaiApiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
        
        if (!this.openaiApiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        
        // Shaun's authentic voice and personality
        this.personalityPrompt = `
You are Shaun Critzer, writing in first person. 

BACKGROUND:
- Recovered from addiction and built successful businesses
- Father of a special needs child
- Authentic transformation story from struggle to success
- Expert in digital marketing, automation, and business building

WRITING STYLE:
- Authentic and vulnerable when sharing personal experiences
- Encouraging and practical in advice
- Direct and actionable in business guidance
- Always include personal story elements
- Provide clear next steps for readers

CONTENT PILLARS:
1. Recovery and personal transformation
2. Business building and entrepreneurship  
3. Digital marketing and automation
4. Special needs parenting insights
5. Overcoming adversity and mindset

TONE: Conversational, encouraging, authentic, practical
ALWAYS INCLUDE: Personal story element, actionable advice, clear call-to-action
`;
    }

    async generateContent(topic, contentType = 'blog') {
        try {
            const prompts = {
                blog: `Write a comprehensive blog post about "${topic}". Include:
                - Personal story or experience related to the topic
                - 3-5 actionable strategies or insights
                - Real examples from your journey
                - Clear call-to-action for readers
                - 800-1200 words
                Format with proper headings and structure.`,
                
                email: `Write a daily email about "${topic}". Include:
                - Personal hook or story (2-3 sentences)
                - One key insight or lesson
                - Actionable advice readers can implement today
                - Warm, encouraging tone
                - Clear call-to-action
                - 200-400 words`,
                
                social: `Create an engaging social media post about "${topic}". Include:
                - Attention-grabbing hook
                - Personal story or insight
                - Actionable tip
                - Relevant hashtags
                - Call-to-action
                - 150-250 words`,
                
                video_script: `Write a 60-90 second video script about "${topic}". Include:
                - Strong opening hook (first 3 seconds)
                - Personal story or example
                - Key takeaway or lesson
                - Clear call-to-action
                - Natural speaking rhythm
                - Engaging and conversational tone`
            };

            const response = await axios.post(`${this.openaiApiBase}/chat/completions`, {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: this.personalityPrompt
                    },
                    {
                        role: 'user',
                        content: prompts[contentType] || prompts.blog
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const content = response.data.choices[0].message.content;
            
            return {
                success: true,
                content: content,
                topic: topic,
                type: contentType,
                generatedAt: new Date().toISOString(),
                wordCount: content.split(' ').length
            };

        } catch (error) {
            console.error('Content generation failed:', error.message);
            return {
                success: false,
                error: error.message,
                fallbackContent: this.getFallbackContent(topic, contentType)
            };
        }
    }

    async generateMultipleContent(topic) {
        try {
            const contentTypes = ['blog', 'email', 'social', 'video_script'];
            const results = {};

            for (const type of contentTypes) {
                const result = await this.generateContent(topic, type);
                results[type] = result;
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return {
                success: true,
                topic: topic,
                content: results,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    getFallbackContent(topic, contentType) {
        const fallbacks = {
            blog: `# ${topic}

Today I want to share something personal about ${topic.toLowerCase()}.

When I was struggling with addiction, I never thought I'd be where I am today. But here's what I learned about ${topic.toLowerCase()} that changed everything...

## The Turning Point

[Personal story about overcoming challenges related to ${topic}]

## What I Learned

1. **Start where you are** - You don't need to be perfect to begin
2. **Take action daily** - Small consistent steps create massive results  
3. **Get support** - You don't have to do this alone

## Your Next Step

If you're ready to transform your life like I did, start with one small action today.

What will you do differently starting now?`,

            email: `Hey there,

Quick story about ${topic.toLowerCase()}...

When I was at my lowest point, I thought ${topic.toLowerCase()} was impossible for me. But I discovered one simple truth that changed everything.

Here's what I learned: [Key insight about ${topic}]

Try this today: [One actionable step]

You've got this!

Shaun`,

            social: `${topic} seemed impossible when I was struggling with addiction.

But here's what I discovered: [Key insight]

If you're facing challenges with ${topic.toLowerCase()}, remember:
✅ Start where you are
✅ Take one small step
✅ Progress over perfection

What's your next move? 💪

#transformation #recovery #business #mindset`,

            video_script: `Hey everyone, Shaun here.

Let me tell you about ${topic.toLowerCase()}...

When I was struggling, I thought this was impossible. But I learned something that changed everything.

[Share key insight about ${topic}]

Here's what you can do today: [Actionable step]

If this helped you, follow for more real talk about transformation and building the life you want.

What's your biggest challenge with ${topic.toLowerCase()}? Let me know in the comments.`
        };

        return fallbacks[contentType] || fallbacks.blog;
    }

    async generateContentIdeas(niche = 'general') {
        const topics = {
            recovery: [
                'The moment I knew I had to change my life',
                'How to rebuild trust after addiction',
                'Finding purpose in recovery',
                'Dealing with triggers in business',
                'The connection between sobriety and success'
            ],
            business: [
                'Building a business while in recovery',
                'Automation tools that changed my life',
                'From broke to profitable in 90 days',
                'The mindset shift that unlocked success',
                'How to start when you have nothing'
            ],
            parenting: [
                'Raising a special needs child while building a business',
                'Teaching resilience to your kids',
                'Balancing family and entrepreneurship',
                'The lessons my son taught me about persistence',
                'Creating stability after chaos'
            ],
            general: [
                'The power of authentic storytelling',
                'Why vulnerability is your superpower',
                'Turning your mess into your message',
                'Building systems that work without you',
                'The compound effect of small daily actions'
            ]
        };

        const selectedTopics = topics[niche] || topics.general;
        const randomTopic = selectedTopics[Math.floor(Math.random() * selectedTopics.length)];
        
        return {
            topic: randomTopic,
            niche: niche,
            suggestedContentTypes: ['blog', 'email', 'social', 'video_script']
        };
    }
}

module.exports = {
    generateContent: async (topic, contentType = 'blog') => {
        const generator = new ContentGenerator();
        return await generator.generateContent(topic, contentType);
    },
    
    generateMultipleContent: async (topic) => {
        const generator = new ContentGenerator();
        return await generator.generateMultipleContent(topic);
    },
    
    generateContentIdeas: async (niche = 'general') => {
        const generator = new ContentGenerator();
        return await generator.generateContentIdeas(niche);
    },
    
    ContentGenerator
};


/**
 * Live Content Generation Module for WealthAutomationHQ
 * OpenAI GPT-4 integration with Shaun's authentic voice
 */

const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

class LiveContentGeneration {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'sk-test-key'
        });
        
        this.shaunVoice = {
            background: "Recovery from addiction, special needs parenting, business transformation",
            tone: "Authentic, vulnerable, encouraging, practical",
            style: "Personal stories, actionable advice, hope-driven",
            expertise: "Business automation, digital marketing, passive income, mindset"
        };
        
        this.contentTopics = [
            "Building wealth through automation and smart systems",
            "Recovery and personal transformation in business",
            "Special needs parenting while building an empire",
            "Passive income strategies that actually work",
            "Digital marketing automation for beginners",
            "Mindset shifts that create lasting wealth",
            "AI tools for business automation",
            "Content creation systems that scale",
            "Affiliate marketing with authentic storytelling",
            "Entrepreneurship after overcoming adversity"
        ];
    }

    async generateBlogPost(topic = null, affiliateOffer = null) {
        try {
            const selectedTopic = topic || this.getRandomTopic();
            
            const prompt = this.createContentPrompt(selectedTopic, affiliateOffer);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: this.getSystemPrompt()
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 2500,
                temperature: 0.7
            });

            const content = response.choices[0].message.content;
            
            // Extract title from content
            const titleMatch = content.match(/^#\s*(.+)$/m);
            const title = titleMatch ? titleMatch[1] : selectedTopic;
            
            // Remove title from content to avoid duplication
            const bodyContent = content.replace(/^#\s*.+$/m, '').trim();
            
            const result = {
                success: true,
                title: title,
                content: bodyContent,
                topic: selectedTopic,
                affiliateOffer: affiliateOffer,
                generatedAt: new Date().toISOString(),
                wordCount: bodyContent.split(' ').length,
                excerpt: this.generateExcerpt(bodyContent),
                seoTitle: this.generateSEOTitle(title),
                seoDescription: this.generateSEODescription(bodyContent),
                tags: this.generateTags(selectedTopic, bodyContent),
                categories: this.determineCategories(selectedTopic)
            };

            // Save to file for logging
            await this.saveContentToFile(result);
            
            console.log('Live content generated successfully:', title);
            return result;

        } catch (error) {
            console.error('Live content generation failed:', error.message);
            return {
                success: false,
                error: error.message,
                fallback: this.generateFallbackContent(topic, affiliateOffer)
            };
        }
    }

    getSystemPrompt() {
        return `You are Shaun Critzer, founder of WealthAutomationHQ. You write authentic, personal blog posts about building wealth through automation and smart systems.

BACKGROUND:
- Overcame addiction and personal struggles
- Father to a special needs child
- Built successful businesses through automation
- Passionate about helping others achieve financial freedom
- Expert in digital marketing, AI tools, and passive income

WRITING STYLE:
- Authentic and vulnerable - share personal struggles and victories
- Practical and actionable - always provide specific steps
- Encouraging and hopeful - inspire others who are struggling
- Story-driven - use personal anecdotes to illustrate points
- Professional but approachable - expert advice in relatable language

CONTENT STRUCTURE:
- Start with a personal hook or story
- Share the struggle or challenge you faced
- Explain the breakthrough or solution you discovered
- Provide actionable steps readers can take
- End with encouragement and a clear next step
- Include relevant personal details about recovery, parenting, or business journey

TONE: Conversational, authentic, encouraging, practical, hope-driven

Write blog posts that feel like personal conversations with someone who truly understands the struggle of building wealth while overcoming life's challenges.`;
    }

    createContentPrompt(topic, affiliateOffer) {
        let prompt = `Write a comprehensive blog post about "${topic}" in Shaun's authentic voice.

REQUIREMENTS:
- 1500-2000 words
- Start with a compelling personal story or struggle
- Include specific, actionable advice
- Share relevant experiences from recovery, special needs parenting, or business building
- End with clear next steps for the reader
- Use markdown formatting for headers and emphasis
- Include a compelling title as the first line (using # header)

PERSONAL ELEMENTS TO WEAVE IN:
- Recovery journey and how it shaped business mindset
- Challenges of building wealth while caring for a special needs child
- Specific automation tools or systems that transformed your business
- Moments of doubt and how you overcame them
- Practical lessons learned from failures and successes

`;

        if (affiliateOffer) {
            prompt += `
AFFILIATE INTEGRATION:
Naturally mention and recommend "${affiliateOffer.name}" as a solution that has helped you or could help readers. Be authentic about why you recommend it and how it fits into the overall strategy. The recommendation should feel organic, not forced.

Affiliate offer details:
- Name: ${affiliateOffer.name}
- Description: ${affiliateOffer.description}
- Categories: ${affiliateOffer.categories.join(', ')}
`;
        }

        prompt += `
Write the blog post now, making it feel like a personal conversation with someone who needs hope and practical guidance.`;

        return prompt;
    }

    getRandomTopic() {
        return this.contentTopics[Math.floor(Math.random() * this.contentTopics.length)];
    }

    generateExcerpt(content, maxLength = 160) {
        // Remove markdown and get plain text
        const plainText = content
            .replace(/#{1,6}\s+/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .trim();
        
        if (plainText.length <= maxLength) {
            return plainText;
        }

        // Find the last complete sentence within the limit
        const truncated = plainText.substring(0, maxLength);
        const lastSentence = truncated.lastIndexOf('.');
        
        if (lastSentence > maxLength * 0.7) {
            return truncated.substring(0, lastSentence + 1);
        }
        
        // If no good sentence break, truncate at word boundary
        const lastSpace = truncated.lastIndexOf(' ');
        return truncated.substring(0, lastSpace) + '...';
    }

    generateSEOTitle(title) {
        // Optimize title for SEO while keeping it under 60 characters
        if (title.length <= 60) {
            return title;
        }
        
        // Try to shorten while keeping key words
        const shortened = title.substring(0, 57) + '...';
        return shortened;
    }

    generateSEODescription(content) {
        const excerpt = this.generateExcerpt(content, 155);
        return excerpt;
    }

    generateTags(topic, content) {
        const topicTags = {
            'automation': ['automation', 'business systems', 'productivity'],
            'recovery': ['personal development', 'mindset', 'transformation'],
            'parenting': ['special needs', 'parenting', 'family business'],
            'passive income': ['passive income', 'affiliate marketing', 'online business'],
            'digital marketing': ['digital marketing', 'content creation', 'social media'],
            'AI': ['artificial intelligence', 'AI tools', 'technology'],
            'entrepreneurship': ['entrepreneurship', 'startup', 'business building']
        };

        let tags = [];
        
        // Add topic-based tags
        for (const [key, tagList] of Object.entries(topicTags)) {
            if (topic.toLowerCase().includes(key) || content.toLowerCase().includes(key)) {
                tags.push(...tagList);
            }
        }

        // Always include core tags
        tags.push('wealth building', 'automation', 'shaun critzer');
        
        // Remove duplicates and limit to 8 tags
        return [...new Set(tags)].slice(0, 8);
    }

    determineCategories(topic) {
        const categoryMap = {
            'automation': ['Business Automation'],
            'recovery': ['Personal Development'],
            'parenting': ['Lifestyle'],
            'passive income': ['Passive Income'],
            'digital marketing': ['Digital Marketing'],
            'AI': ['Technology'],
            'entrepreneurship': ['Entrepreneurship'],
            'affiliate': ['Affiliate Marketing']
        };

        for (const [key, categories] of Object.entries(categoryMap)) {
            if (topic.toLowerCase().includes(key)) {
                return categories;
            }
        }

        return ['Business Automation']; // Default category
    }

    async saveContentToFile(contentData) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `content-${timestamp}.json`;
            const filepath = path.join('/tmp', filename);
            
            await fs.writeFile(filepath, JSON.stringify(contentData, null, 2));
            console.log('Content saved to file:', filepath);
            
        } catch (error) {
            console.error('Failed to save content to file:', error.message);
        }
    }

    generateFallbackContent(topic, affiliateOffer) {
        const fallbackTopic = topic || "Building Wealth Through Smart Automation";
        
        return {
            success: true,
            title: `${fallbackTopic}: My Personal Journey to Success`,
            content: this.createFallbackBlogPost(fallbackTopic, affiliateOffer),
            topic: fallbackTopic,
            affiliateOffer: affiliateOffer,
            generatedAt: new Date().toISOString(),
            wordCount: 800,
            excerpt: "A personal story about overcoming challenges and building wealth through automation and smart systems.",
            seoTitle: fallbackTopic,
            seoDescription: "Learn how I overcame addiction and built a successful business through automation and smart systems.",
            tags: ['automation', 'personal development', 'wealth building', 'entrepreneurship'],
            categories: ['Business Automation'],
            fallback: true
        };
    }

    createFallbackBlogPost(topic, affiliateOffer) {
        return `## The Struggle Was Real

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

${affiliateOffer ? `

## A Tool That Changed Everything

One system that completely transformed my approach was **${affiliateOffer.name}**. ${affiliateOffer.description}

It helped me automate the exact processes I'm sharing with you today. If you're serious about ${topic.toLowerCase()}, I highly recommend checking it out.

` : ''}

## Your Next Step

Ready to transform your approach to ${topic.toLowerCase()}? 

I've built a complete automation system that generates content, builds audiences, and creates passive income - all while you focus on what matters most.

Remember: Your past doesn't define your future. Your next decision does.

What will you choose today?

---

*P.S. If this resonated with you, share it with someone who needs to hear this message. Sometimes we all need a reminder that change is possible.*`;
    }

    async generateEmailContent(blogTitle, blogContent, blogUrl, affiliateOffer) {
        try {
            const emailPrompt = `Create an engaging email to send to the WealthAutomationHQ subscriber list about the new blog post: "${blogTitle}"

REQUIREMENTS:
- Personal, conversational tone from Shaun
- Brief preview of the blog content (2-3 sentences)
- Clear call-to-action to read the full post
- Include the blog URL: ${blogUrl}
- Keep it concise but engaging (300-500 words)
- End with Shaun's signature style

${affiliateOffer ? `Also naturally mention ${affiliateOffer.name} as a recommended resource.` : ''}

Write the email content in HTML format suitable for ConvertKit.`;

            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are Shaun Critzer writing a personal email to your subscribers about your latest blog post. Keep it authentic, engaging, and action-oriented."
                    },
                    {
                        role: "user",
                        content: emailPrompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            });

            return {
                success: true,
                content: response.choices[0].message.content,
                subject: this.generateEmailSubject(blogTitle)
            };

        } catch (error) {
            console.error('Email content generation failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateEmailSubject(blogTitle) {
        const subjects = [
            `New post: ${blogTitle}`,
            `Just published: ${blogTitle}`,
            `My latest thoughts: ${blogTitle}`,
            `Something I wanted to share: ${blogTitle}`,
            `Fresh insights: ${blogTitle}`
        ];

        return subjects[Math.floor(Math.random() * subjects.length)];
    }
}

module.exports = {
    generateContent: async (topic, affiliateOffer) => {
        const generator = new LiveContentGeneration();
        return await generator.generateBlogPost(topic, affiliateOffer);
    },
    
    generateEmailContent: async (blogTitle, blogContent, blogUrl, affiliateOffer) => {
        const generator = new LiveContentGeneration();
        return await generator.generateEmailContent(blogTitle, blogContent, blogUrl, affiliateOffer);
    },
    
    LiveContentGeneration
};


/**
 * Test Content Generation Module for WealthAutomation
 * Works without OpenAI API for immediate testing
 */

class ContentGeneratorTest {
    constructor() {
        // Test mode - uses fallback content instead of API
        this.testMode = true;
    }

    async generateContent(topic, contentType = 'blog') {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const content = this.getTestContent(topic, contentType);
            
            return {
                success: true,
                content: content,
                topic: topic,
                type: contentType,
                generatedAt: new Date().toISOString(),
                wordCount: content.split(' ').length,
                testMode: true
            };

        } catch (error) {
            console.error('Content generation failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getTestContent(topic, contentType) {
        const contents = {
            blog: `# ${topic}: My Personal Journey to Success

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

*P.S. If this resonated with you, share it with someone who needs to hear this message. Sometimes we all need a reminder that change is possible.*`,

            email: `Subject: The ${topic} breakthrough that changed everything

Hey there,

Quick personal story about ${topic.toLowerCase()}...

When I was at my lowest point - struggling with addiction, broke, and feeling like a failure as a father - ${topic.toLowerCase()} felt impossible.

But here's what I discovered that changed everything:

**The power of automated systems.**

Instead of trying to do everything manually, I built systems that worked while I focused on recovery and being present for my special needs son.

Here's the simple truth: ${topic.toLowerCase()} isn't about working harder. It's about working smarter.

**Try this today:**
Identify one task related to ${topic.toLowerCase()} that you do repeatedly. Then ask: "How can I automate or systematize this?"

That one question transformed my business and my life.

You've got this,

Shaun

P.S. Want to see the exact automation system I use? Reply and let me know - I'll share the details.`,

            social: `${topic} seemed impossible when I was struggling with addiction and barely making ends meet.

But here's what I learned: 

Success isn't about perfection. It's about systems.

While others were grinding 24/7, I built automated systems that worked while I focused on:
✅ My recovery
✅ Being present for my special needs son  
✅ Building real wealth

The result? Passive income that grows while I sleep.

If you're tired of the hustle and ready for smart systems, let's connect.

What's your biggest challenge with ${topic.toLowerCase()}? 👇

#automation #recovery #business #passiveincome #systemsthinking #entrepreneurship`,

            video_script: `[HOOK - First 3 seconds]
"I was broke, addicted, and failing as a father..."

[STORY - 10 seconds]
"When I hit rock bottom, ${topic.toLowerCase()} felt impossible. But I discovered something that changed everything."

[REVELATION - 15 seconds]  
"The secret wasn't working harder - it was building systems that worked while I focused on recovery and my special needs son."

[PROOF - 10 seconds]
"Now I generate passive income through automation while being the father and person I always wanted to be."

[CALL TO ACTION - 10 seconds]
"If you're ready to stop grinding and start systematizing, follow me for real talk about building wealth through smart systems."

[ENGAGEMENT - 5 seconds]
"What's your biggest challenge with ${topic.toLowerCase()}? Drop it in the comments."

[END SCREEN]
"Your past doesn't define your future. Your next system does."`
        };

        return contents[contentType] || contents.blog;
    }

    async generateMultipleContent(topic) {
        try {
            const contentTypes = ['blog', 'email', 'social', 'video_script'];
            const results = {};

            for (const type of contentTypes) {
                const result = await this.generateContent(topic, type);
                results[type] = result;
            }

            return {
                success: true,
                topic: topic,
                content: results,
                generatedAt: new Date().toISOString(),
                testMode: true
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = {
    generateContent: async (topic, contentType = 'blog') => {
        const generator = new ContentGeneratorTest();
        return await generator.generateContent(topic, contentType);
    },
    
    generateMultipleContent: async (topic) => {
        const generator = new ContentGeneratorTest();
        return await generator.generateMultipleContent(topic);
    },
    
    ContentGeneratorTest
};


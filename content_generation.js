/**
 * Content Generation Script for WealthAutomationHQ
 * 
 * This script generates unique daily content for blog posts and emails
 * using OpenAI's GPT-4 API with proper randomization and uniqueness checks.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const wordpressIntegration = require('./wordpress_integration');
const convertkitIntegration = require('./convertkit_integration');
const offerLibrary = require('./offer_library');

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const GOOGLE_SHEETS_UTM_TRACKER_ID = process.env.GOOGLE_SHEETS_UTM_TRACKER_ID;

// Constants
const LOGS_DIR = path.join(__dirname, 'logs');
const POST_LOG_FILE = path.join(LOGS_DIR, 'post_log.json');
const ERROR_LOG_FILE = path.join(LOGS_DIR, 'errors.txt');
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Generate a blog post using OpenAI API
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated post data
 */
async function generateBlogPost(options = {}) {
  try {
    console.log('Generating blog post content...');
    
    // Add randomization to ensure uniqueness
    const currentDate = new Date().toISOString().split('T')[0];
    const randomSeed = crypto.randomBytes(4).toString('hex');
    
    // Create a unique prompt for each generation
    const prompt = `
      Write a comprehensive, engaging blog post about ${options.topic || 'wealth automation and passive income strategies'}.
      Today's date is ${currentDate}.
      Make this post unique and different from previous content.
      Unique identifier: ${randomSeed}
      
      The post should include:
      - An attention-grabbing headline
      - An engaging introduction that hooks the reader
      - 3-5 main sections with valuable insights
      - Practical tips and actionable advice
      - A compelling conclusion with a call to action
      
      Format the post in HTML with proper heading tags, paragraphs, and occasional bold or italic text for emphasis.
      The tone should be authoritative yet conversational, positioning the author as an expert in wealth automation.
    `;
    
    // Call OpenAI API with parameters that encourage uniqueness
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert in wealth automation, passive income, and online business strategies.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,  // Higher temperature for more randomness
        max_tokens: 2000,
        presence_penalty: 0.6,  // Encourage new topics
        frequency_penalty: 0.6  // Discourage repetition
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract content from response
    const content = response.data.choices[0].message.content.trim();
    
    // Extract title from content (assuming it's the first line)
    const titleMatch = content.match(/<h1>(.*?)<\/h1>/) || content.match(/^#\s+(.*?)$/m);
    const title = titleMatch ? titleMatch[1] : `Wealth Automation Strategies - ${currentDate}`;
    
    // Generate excerpt
    const excerpt = content
      .replace(/<[^>]*>/g, '')  // Remove HTML tags
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .slice(0, 150) + '...';   // Truncate
    
    // Add affiliate offer
    const contentWithOffer = await addAffiliateOffer(content);
    
    return {
      title,
      content: contentWithOffer,
      excerpt,
      date: currentDate,
      uniqueId: randomSeed
    };
  } catch (error) {
    console.error(`Error generating blog post: ${error.message}`);
    logError(`Blog post generation failed: ${error.message}`);
    throw new Error(`Failed to generate blog post: ${error.message}`);
  }
}

/**
 * Add an affiliate offer to content
 * @param {string} content - Original content
 * @returns {Promise<string>} Content with affiliate offer
 */
async function addAffiliateOffer(content) {
  try {
    // Extract topics from content
    const topics = extractTopics(content);
    
    // Get matching offer from library
    const offer = await offerLibrary.getMatchingOffer(topics);
    
    // If no offer found, return original content
    if (!offer) {
      console.log('No matching affiliate offer found');
      return content;
    }
    
    console.log(`Adding affiliate offer: ${offer.name}`);
    
    // Get CTA template from offer
    const ctaTemplate = offer.ctaTemplates[Math.floor(Math.random() * offer.ctaTemplates.length)];
    
    // Replace placeholders in template
    const cta = ctaTemplate.replace(/\{\{url\}\}/g, offer.url);
    
    // Add CTA to content (before the conclusion)
    const contentWithOffer = content.replace(
      /(<h2>Conclusion|<h2>Summary|<h2>Final Thoughts)/i,
      `<div class="affiliate-offer">${cta}</div>\n\n$1`
    );
    
    return contentWithOffer;
  } catch (error) {
    console.error(`Error adding affiliate offer: ${error.message}`);
    // Return original content if offer addition fails
    return content;
  }
}

/**
 * Extract topics from content
 * @param {string} content - Content to analyze
 * @returns {Array} Extracted topics
 */
function extractTopics(content) {
  // Simple keyword extraction
  const keywords = [
    'email marketing', 'affiliate marketing', 'passive income',
    'automation', 'AI tools', 'content creation', 'SEO',
    'lead generation', 'sales funnel', 'digital products'
  ];
  
  const foundTopics = [];
  
  keywords.forEach(keyword => {
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      foundTopics.push(keyword);
    }
  });
  
  return foundTopics.length > 0 ? foundTopics : ['wealth automation'];
}

/**
 * Publish content to WordPress and ConvertKit
 * @param {Object} postData - Post data
 * @param {Object} options - Publishing options
 * @returns {Promise<Object>} Publishing results
 */
async function publishContent(postData, options = {}) {
  try {
    console.log(`Publishing content: ${postData.title}`);
    
    const results = {
      wordpress: null,
      convertkit: null,
      mock: options.mock === true
    };
    
    // If in mock mode, save to file instead of publishing
    if (options.mock === true || MOCK_MODE) {
      console.log('Running in mock mode - saving to file');
      
      const mockFilePath = path.join(LOGS_DIR, `blog-${postData.uniqueId}.txt`);
      fs.writeFileSync(mockFilePath, `Title: ${postData.title}\n\n${postData.content}`);
      
      results.mockFilePath = mockFilePath;
    } else {
      // Publish to WordPress
      if (options.wordpress !== false) {
        console.log('Publishing to WordPress...');
        
        const wpPostData = {
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          status: 'publish'
        };
        
        results.wordpress = await wordpressIntegration.createPost(wpPostData);
      }
      
      // Send as ConvertKit broadcast
      if (options.convertkit !== false) {
        console.log('Sending as ConvertKit broadcast...');
        
        results.convertkit = await convertkitIntegration.sendPostAsBroadcast(postData);
      }
    }
    
    // Log the post
    logPost(postData, results);
    
    // Send notification
    await sendNotification(postData, results);
    
    return results;
  } catch (error) {
    console.error(`Error publishing content: ${error.message}`);
    logError(`Content publishing failed: ${error.message}`);
    throw new Error(`Failed to publish content: ${error.message}`);
  }
}

/**
 * Log post to JSON file
 * @param {Object} postData - Post data
 * @param {Object} results - Publishing results
 */
function logPost(postData, results) {
  try {
    console.log('Logging post data...');
    
    // Create log entry
    const logEntry = {
      title: postData.title,
      date: postData.date || new Date().toISOString(),
      uniqueId: postData.uniqueId,
      excerpt: postData.excerpt,
      wordpressId: results.wordpress ? results.wordpress.id : null,
      convertkitId: results.convertkit ? results.convertkit.broadcast.id : null,
      mock: results.mock
    };
    
    // Read existing log or create new one
    let logData = [];
    if (fs.existsSync(POST_LOG_FILE)) {
      const logContent = fs.readFileSync(POST_LOG_FILE, 'utf8');
      try {
        logData = JSON.parse(logContent);
      } catch (e) {
        console.error('Error parsing log file, creating new one');
      }
    }
    
    // Add new entry
    logData.push(logEntry);
    
    // Write updated log
    fs.writeFileSync(POST_LOG_FILE, JSON.stringify(logData, null, 2));
    
    console.log('Post logged successfully');
  } catch (error) {
    console.error(`Error logging post: ${error.message}`);
  }
}

/**
 * Log error to file
 * @param {string} message - Error message
 */
function logError(message) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    fs.appendFileSync(ERROR_LOG_FILE, logEntry);
  } catch (error) {
    console.error(`Error writing to error log: ${error.message}`);
  }
}

/**
 * Send notification about new content
 * @param {Object} postData - Post data
 * @param {Object} results - Publishing results
 */
async function sendNotification(postData, results) {
  try {
    if (!DISCORD_WEBHOOK_URL) {
      console.log('Discord webhook URL not configured, skipping notification');
      return;
    }
    
    console.log('Sending Discord notification...');
    
    // Create notification message
    const message = {
      content: results.mock ? '🔵 **Mock Post Generated**' : '🟢 **New Content Published**',
      embeds: [{
        title: postData.title,
        description: postData.excerpt,
        color: results.mock ? 3447003 : 5763719,
        fields: [
          {
            name: 'Date',
            value: postData.date,
            inline: true
          },
          {
            name: 'Mode',
            value: results.mock ? 'Mock' : 'Live',
            inline: true
          }
        ],
        timestamp: new Date().toISOString()
      }]
    };
    
    // Add WordPress link if available
    if (results.wordpress && results.wordpress.link) {
      message.embeds[0].fields.push({
        name: 'WordPress',
        value: `[View Post](${results.wordpress.link})`,
        inline: true
      });
    }
    
    // Send notification
    await axios.post(DISCORD_WEBHOOK_URL, message);
    
    console.log('Notification sent successfully');
  } catch (error) {
    console.error(`Error sending notification: ${error.message}`);
  }
}

/**
 * Main function
 * @param {Object} options - Script options
 * @returns {Promise<Object>} Results
 */
async function main(options = {}) {
  try {
    console.log('Starting content generation process...');
    console.log(`Options: ${JSON.stringify(options)}`);
    
    // Generate blog post
    const postData = await generateBlogPost({
      topic: options.topic
    });
    
    // Publish content
    const results = await publishContent(postData, {
      mock: options.mock === true || MOCK_MODE,
      wordpress: options.wordpress !== false,
      convertkit: options.convertkit !== false
    });
    
    console.log('Content generation process completed successfully');
    return { ...postData, ...results };
  } catch (error) {
    console.error(`Content generation process failed: ${error.message}`);
    logError(`Main process failed: ${error.message}`);
    throw error;
  }
}

// Export functions
module.exports = {
  generateBlogPost,
  publishContent,
  addAffiliateOffer,
  main
};

// Run if called directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    mock: args.includes('--mock'),
    daily: args.includes('--daily'),
    live: args.includes('--live')
  };
  
  // Get topic if specified
  const topicIndex = args.findIndex(arg => arg === '--topic');
  if (topicIndex !== -1 && args[topicIndex + 1]) {
    options.topic = args[topicIndex + 1];
  }
  
  // Override mock mode if --live is specified
  if (options.live) {
    options.mock = false;
  }
  
  // Run main function
  main(options)
    .then(results => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error(`Script failed: ${error.message}`);
      process.exit(1);
    });
}

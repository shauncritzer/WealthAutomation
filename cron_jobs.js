/**
 * Cron Jobs for WealthAutomation
 * 
 * This file replaces the Python-based cron jobs with Node.js equivalents
 * using node-cron for scheduling and the existing JS modules for functionality.
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const contentGeneration = require('./content_generation');
const wordpressIntegration = require('./wordpress_integration');
const convertkitIntegration = require('./convertkit_integration');

// Load environment variables
dotenv.config();

// Logging function
function logMessage(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  console.log(logEntry);
  
  // Append to log file
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `wealthautomation_${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logEntry + '\n');
}

// Discord notification function (if used)
async function sendDiscordNotification(message, level = 'INFO') {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  
  try {
    const color = {
      'INFO': 3447003,    // Blue
      'SUCCESS': 5763719, // Green
      'WARNING': 16776960,// Yellow
      'ERROR': 15548997   // Red
    }[level] || 3447003;
    
    await axios.post(webhookUrl, {
      embeds: [{
        title: `WealthAutomation ${level}`,
        description: message,
        color: color,
        timestamp: new Date().toISOString()
      }]
    });
  } catch (error) {
    console.error(`Error sending Discord notification: ${error.message}`);
  }
}

// Main automation cycle
async function runWealthAutomationCycle(topic = "Advanced AI Monetization Techniques") {
  logMessage("========================================");
  logMessage("WealthAutomation Cycle Starting...");
  logMessage("========================================");
  
  try {
    // 1. Generate Content
    logMessage("Generating content for topic: " + topic);
    const { blogTitle, blogContent, emailSubject, emailContent } = 
      await contentGeneration.generateContent(topic);
    
    // 2. Add CTAs to content
    logMessage("Adding CTAs to content");
    const blogContentWithCta = contentGeneration.addCtaToContent(blogContent);
    const emailContentWithCta = contentGeneration.addCtaToContent(emailContent, 'email');
    
    // 3. Post to WordPress
    let postId = null;
    let postUrl = null;
    
    try {
      logMessage("Posting to WordPress...");
      const result = await wordpressIntegration.createPost(blogTitle, blogContentWithCta);
      postId = result.id;
      postUrl = result.link;
      
      logMessage(`Successfully posted to WordPress. Post ID: ${postId}, URL: ${postUrl}`, "SUCCESS");
      await sendDiscordNotification(`New WordPress Post: ${blogTitle} (${postUrl})`, "SUCCESS");
    } catch (error) {
      logMessage(`Error posting to WordPress: ${error.message}`, "ERROR");
      await sendDiscordNotification(`WordPress posting FAILED: ${error.message}`, "ERROR");
      
      // Save fallback
      const wpFallbackFile = path.join(__dirname, 'logs', `wp_fallback_${Date.now()}.json`);
      fs.writeFileSync(wpFallbackFile, JSON.stringify({
        title: blogTitle,
        content: blogContentWithCta,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      logMessage(`Saved WordPress fallback to: ${wpFallbackFile}`, "WARNING");
    }
    
    // 4. Send ConvertKit Email
    let emailBlastId = null;
    
    try {
      logMessage("Sending ConvertKit email...");
      
      // Add blog post URL to email if post was successful
      let finalEmailContent = emailContentWithCta;
      if (postUrl) {
        finalEmailContent += `<p>Read the full post here: <a href="${postUrl}">${postUrl}</a></p>`;
      }
      
      const result = await convertkitIntegration.createAndSendBroadcast(emailSubject, finalEmailContent);
      emailBlastId = result.id;
      
      logMessage(`Successfully sent ConvertKit email. Blast ID: ${emailBlastId}`, "SUCCESS");
      await sendDiscordNotification(`ConvertKit Email Sent: ${emailSubject} (Blast ID: ${emailBlastId})`, "SUCCESS");
    } catch (error) {
      logMessage(`Error sending ConvertKit email: ${error.message}`, "ERROR");
      await sendDiscordNotification(`ConvertKit email sending FAILED: ${error.message}`, "ERROR");
      
      // Save fallback
      const ckFallbackFile = path.join(__dirname, 'logs', `ck_fallback_${Date.now()}.json`);
      fs.writeFileSync(ckFallbackFile, JSON.stringify({
        subject: emailSubject,
        content: emailContentWithCta,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      logMessage(`Saved ConvertKit fallback to: ${ckFallbackFile}`, "WARNING");
    }
    
    // 5. Trigger Make.com Webhook (if WordPress post succeeded)
    if (postId && postUrl && process.env.MAKE_WEBHOOK_URL) {
      try {
        logMessage("Triggering Make.com webhook...");
        
        const webhookPayload = {
          event: "new_wordpress_post",
          post_id: postId,
          post_title: blogTitle,
          post_url: postUrl,
          auth_method_used: "jwt",
          timestamp: new Date().toISOString()
        };
        
        const response = await axios.post(process.env.MAKE_WEBHOOK_URL, webhookPayload, { timeout: 15000 });
        logMessage(`Successfully triggered Make.com webhook. Response: ${response.data}`);
        await sendDiscordNotification(`Triggered Make.com webhook for post ID ${postId}`, "INFO");
      } catch (error) {
        logMessage(`Error triggering Make.com webhook: ${error.message}`, "ERROR");
        await sendDiscordNotification(`Make.com webhook trigger FAILED: ${error.message}`, "ERROR");
      }
    } else if (!postId) {
      logMessage("Skipping Make.com webhook trigger because WordPress post failed.", "INFO");
    } else if (!process.env.MAKE_WEBHOOK_URL) {
      logMessage("Make.com webhook URL not configured, skipping trigger.", "INFO");
    }
    
    logMessage("WealthAutomation cycle finished.");
    await sendDiscordNotification("WealthAutomation cycle finished.", "INFO");
  } catch (error) {
    logMessage(`UNHANDLED EXCEPTION in main cycle: ${error.message}`, "ERROR");
    await sendDiscordNotification(`UNHANDLED EXCEPTION in main cycle: ${error.message}`, "ERROR");
  }
  
  logMessage("========================================");
  logMessage("WealthAutomation Cycle Complete.");
  logMessage("========================================");
}

// Check essential credentials
function checkEssentialCredentials() {
  const essentialVars = [
    "OPENAI_API_KEY", 
    "WORDPRESS_USER", 
    "WORDPRESS_JWT_SECRET", 
    "WORDPRESS_APP_PASSWORD", 
    "CONVERTKIT_API_KEY_V4"
  ];
  
  const missingVars = essentialVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const message = `CRITICAL ERROR: Missing essential environment variables: ${missingVars.join(', ')}. System cannot run.`;
    logMessage(message, "ERROR");
    sendDiscordNotification(message, "ERROR");
    return false;
  }
  
  logMessage("All essential credentials loaded.");
  return true;
}

// Schedule cron jobs
function scheduleCronJobs() {
  // Daily content generation at 5:00 AM
  cron.schedule('0 5 * * *', async () => {
    if (checkEssentialCredentials()) {
      await runWealthAutomationCycle();
    }
  });
  
  // Log scheduled jobs
  logMessage("Scheduled daily content generation job for 5:00 AM");
}

// Export functions for use in other modules
module.exports = {
  scheduleCronJobs,
  runWealthAutomationCycle,
  logMessage,
  sendDiscordNotification
};

// Run immediately if this file is executed directly
if (require.main === module) {
  logMessage("Initializing WealthAutomation cron jobs...");
  scheduleCronJobs();
}

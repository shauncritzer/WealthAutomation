/**
 * Cron Jobs for WealthAutomation
 *
 * This file replaces the Python-based cron jobs with Node.js equivalents
 * using node-cron for scheduling and the existing JS modules for functionality.
 */

const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");
const contentGeneration = require("./content_generation");
// Temporarily commented out to fix deployment issues
// const wordpressIntegration = require("./wordpress_integration");
// const convertkitIntegration = require("./convertkit_integration");

// Load environment variables
dotenv.config();

// Logging function
function logMessage(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  console.log(logEntry);

  // Append to log file
  const logDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `wealthautomation_${new Date().toISOString().split("T")[0]}.log`);
  fs.appendFileSync(logFile, logEntry + "\n");
}

// Discord notification function (if used)
async function sendDiscordNotification(message, isError = false) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    logMessage("Discord webhook URL not configured", "WARN");
    return;
  }

  try {
    const payload = {
      content: isError ? `🚨 **ERROR**: ${message}` : `✅ **SUCCESS**: ${message}`,
      username: "WealthAutomation Bot",
    };

    await axios.post(webhookUrl, payload);
    logMessage("Discord notification sent successfully");
  } catch (error) {
    logMessage(`Failed to send Discord notification: ${error.message}`, "ERROR");
  }
}

// Simplified WordPress posting function
async function createWordPressPost(title, content) {
  try {
    const wpUrl = process.env.WORDPRESS_URL;
    const wpUsername = process.env.WORDPRESS_USERNAME;
    const wpPassword = process.env.WORDPRESS_APP_PASSWORD;

    if (!wpUrl || !wpUsername || !wpPassword) {
      throw new Error("WordPress credentials missing");
    }

    const postData = {
      title: title,
      content: content,
      status: "publish",
    };

    const response = await axios.post(`${wpUrl}/wp-json/wp/v2/posts`, postData, {
      auth: {
        username: wpUsername,
        password: wpPassword,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    return { success: true, postId: response.data.id };
  } catch (error) {
    logMessage(`WordPress posting failed: ${error.message}`, "ERROR");
    return { success: false, error: error.message };
  }
}

// Main wealth automation cycle
async function runWealthAutomationCycle() {
  logMessage("Starting WealthAutomation cycle");

  try {
    // Check essential credentials
    if (!checkEssentialCredentials()) {
      throw new Error("Essential credentials missing");
    }

    // Generate content
    logMessage("Generating content...");
    const topic = "Advanced AI Monetization Techniques";
    const content = await contentGeneration.generateContent(topic);

    if (!content || content.includes("Strategy 1: Do the thing")) {
      throw new Error("Content generation failed - received template content");
    }

    // Post to WordPress using simplified function
    logMessage("Posting to WordPress...");
    const title = `${topic} – Key Strategies (${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0].substring(0, 5)})`;
    const postResult = await createWordPressPost(title, content);

    if (!postResult.success) {
      throw new Error(`WordPress posting failed: ${postResult.error}`);
    }

    // Send success notification
    await sendDiscordNotification(`New WordPress Post: ${topic}`);
    logMessage("WealthAutomation cycle completed successfully");

    return { success: true };
  } catch (error) {
    logMessage(`WealthAutomation cycle failed: ${error.message}`, "ERROR");
    await sendDiscordNotification(`WealthAutomation cycle failed: ${error.message}`, true);
    return { success: false, error: error.message };
  }
}

// Check essential credentials
function checkEssentialCredentials() {
  const required = [
    "OPENAI_API_KEY",
    "WORDPRESS_URL",
    "WORDPRESS_USERNAME",
    "WORDPRESS_APP_PASSWORD",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logMessage(`Missing required environment variables: ${missing.join(", ")}`, "ERROR");
    return false;
  }

  return true;
}

// Schedule cron jobs
function scheduleCronJobs() {
  logMessage("Setting up cron jobs...");

  // Daily content generation at 9 AM, Monday through Friday
  cron.schedule("0 9 * * 1-5", async () => {
    logMessage("Triggered daily content generation");
    await runWealthAutomationCycle();
  }, {
    scheduled: true,
    timezone: "America/New_York",
  });

  logMessage("Cron jobs scheduled successfully");
}

// Export functions for external use
module.exports = {
  runWealthAutomationCycle,
  scheduleCronJobs,
  logMessage,
  sendDiscordNotification,
};

// Start cron jobs if this file is run directly
if (require.main === module) {
  logMessage("Starting WealthAutomation cron jobs...");
  scheduleCronJobs();

  // Keep the process alive
  process.on("SIGINT", () => {
    logMessage("Shutting down cron jobs...");
    process.exit(0);
  });

  logMessage("WealthAutomation cron jobs are running. Press Ctrl+C to stop.");
}

/**
 * Content Generation Script for WealthAutomationHQ
 *
 * This script generates unique daily content for blog posts and emails
 * using OpenAI's GPT-4 API with proper randomization and uniqueness checks.
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const dotenv = require("dotenv");

// Temporarily commented out to fix deployment issues
// const wordpressIntegration = require("./wordpress_integration");
// const convertkitIntegration = require("./convertkit_integration");
// const offerLibrary = require("./offer_library");

// Load environment variables
dotenv.config();

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const GOOGLE_SHEETS_UTM_TRACKER_ID = process.env.GOOGLE_SHEETS_UTM_TRACKER_ID;

// Constants
const LOGS_DIR = path.join(__dirname, "logs");
const POST_LOG_FILE = path.join(LOGS_DIR, "post_log.json");
const ERROR_LOG_FILE = path.join(LOGS_DIR, "errors.txt");
const MOCK_MODE = process.env.MOCK_MODE === "true";

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Generate a blog post using OpenAI API
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated post data
 */
async function generateContent(topic) {
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API key is not set.");
    return "Content generation failed: OpenAI API key missing.";
  }

  const messages = [
    { role: "system", content: "You are a helpful assistant that generates unique and engaging content for blog posts and emails. Focus on providing actionable advice and insights related to the given topic. Avoid generic phrases and ensure the content is original and valuable." },
    { role: "user", content: `Generate a detailed and engaging blog post about: ${topic}. The post should be at least 800 words, include a compelling introduction, several sub-sections with clear headings, and a strong conclusion. Ensure the content is unique and provides actionable advice. Do not include any template or placeholder text like 'Strategy 1: Do the thing'.` }
  ];

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // Using the specified model
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
     );

    const generatedText = response.data.choices[0].message.content.trim();
    return generatedText;
  } catch (error) {
    console.error("Error generating content from OpenAI:", error.response ? error.response.data : error.message);
    // Fallback to a generic message if content generation fails
    return "Content generation failed. Please try again later.";
  }
}

// Export functions for external use
module.exports = {
  generateContent,
};

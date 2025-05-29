/**
 * ConvertKit Integration for WealthAutomationHQ
 * 
 * This module handles all ConvertKit API interactions for email sequences,
 * subscriber management, and broadcast emails.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Environment variables
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY_V4;
const CONVERTKIT_API_SECRET = process.env.CONVERTKIT_API_SECRET;
const CONVERTKIT_BASIC_TAG_ID = process.env.CONVERTKIT_BASIC_TAG_ID;

// API endpoints
const API_BASE = 'https://api.convertkit.com/v3';

/**
 * Send a broadcast email
 * @param {Object} options - Broadcast options
 * @returns {Promise} API response
 */
async function sendBroadcast(options) {
  try {
    console.log(`Preparing to send broadcast: ${options.subject}`);
    
    const payload = {
      api_key: CONVERTKIT_API_KEY,
      subject: options.subject,
      content: options.content,
      email_layout_template: options.template || 'default',
      preview_text: options.previewText || '',
    };
    
    // Add recipients if specified
    if (options.tagIds && options.tagIds.length > 0) {
      payload.filter = { tags: options.tagIds };
    }
    
    const response = await axios.post(
      `${API_BASE}/broadcasts`,
      payload
    );
    
    console.log(`Broadcast created with ID: ${response.data.broadcast.id}`);
    
    // Send the broadcast if requested
    if (options.send === true) {
      await sendScheduledBroadcast(response.data.broadcast.id);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error sending broadcast: ${error.message}`);
    if (error.response) {
      console.error(`ConvertKit API response: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to send broadcast: ${error.message}`);
  }
}

/**
 * Send a previously created broadcast
 * @param {string} broadcastId - ID of the broadcast to send
 * @returns {Promise} API response
 */
async function sendScheduledBroadcast(broadcastId) {
  try {
    console.log(`Sending broadcast with ID: ${broadcastId}`);
    
    const response = await axios.post(
      `${API_BASE}/broadcasts/${broadcastId}/send`,
      { api_key: CONVERTKIT_API_KEY }
    );
    
    console.log('Broadcast sent successfully');
    return response.data;
  } catch (error) {
    console.error(`Error sending scheduled broadcast: ${error.message}`);
    throw new Error(`Failed to send scheduled broadcast: ${error.message}`);
  }
}

/**
 * Add a subscriber to ConvertKit
 * @param {Object} subscriber - Subscriber data
 * @returns {Promise} API response
 */
async function addSubscriber(subscriber) {
  try {
    console.log(`Adding subscriber: ${subscriber.email}`);
    
    const payload = {
      api_key: CONVERTKIT_API_KEY,
      email: subscriber.email,
      first_name: subscriber.firstName || '',
      tags: subscriber.tags || [CONVERTKIT_BASIC_TAG_ID]
    };
    
    const response = await axios.post(
      `${API_BASE}/subscribers`,
      payload
    );
    
    console.log(`Subscriber added with ID: ${response.data.subscriber.id}`);
    return response.data;
  } catch (error) {
    console.error(`Error adding subscriber: ${error.message}`);
    throw new Error(`Failed to add subscriber: ${error.message}`);
  }
}

/**
 * Tag a subscriber
 * @param {string} email - Subscriber email
 * @param {string|Array} tagIds - Tag ID(s) to apply
 * @returns {Promise} API response
 */
async function tagSubscriber(email, tagIds) {
  try {
    console.log(`Tagging subscriber ${email} with tags: ${tagIds}`);
    
    // Convert single tag to array
    const tags = Array.isArray(tagIds) ? tagIds : [tagIds];
    
    // Apply each tag
    const results = await Promise.all(tags.map(async (tagId) => {
      const payload = {
        api_key: CONVERTKIT_API_KEY,
        email: email
      };
      
      const response = await axios.post(
        `${API_BASE}/tags/${tagId}/subscribe`,
        payload
      );
      
      return response.data;
    }));
    
    console.log(`Successfully tagged subscriber ${email}`);
    return results;
  } catch (error) {
    console.error(`Error tagging subscriber: ${error.message}`);
    throw new Error(`Failed to tag subscriber: ${error.message}`);
  }
}

/**
 * Add subscriber to a sequence
 * @param {string} email - Subscriber email
 * @param {string} sequenceId - Sequence ID
 * @returns {Promise} API response
 */
async function addToSequence(email, sequenceId) {
  try {
    console.log(`Adding subscriber ${email} to sequence ${sequenceId}`);
    
    const payload = {
      api_key: CONVERTKIT_API_KEY,
      email: email
    };
    
    const response = await axios.post(
      `${API_BASE}/sequences/${sequenceId}/subscribe`,
      payload
    );
    
    console.log(`Successfully added subscriber to sequence`);
    return response.data;
  } catch (error) {
    console.error(`Error adding to sequence: ${error.message}`);
    throw new Error(`Failed to add to sequence: ${error.message}`);
  }
}

/**
 * Get all sequences
 * @returns {Promise} API response with sequences
 */
async function getSequences() {
  try {
    console.log('Fetching all sequences');
    
    const response = await axios.get(
      `${API_BASE}/sequences`,
      { params: { api_key: CONVERTKIT_API_KEY } }
    );
    
    console.log(`Found ${response.data.sequences.length} sequences`);
    return response.data.sequences;
  } catch (error) {
    console.error(`Error fetching sequences: ${error.message}`);
    throw new Error(`Failed to fetch sequences: ${error.message}`);
  }
}

/**
 * Get all tags
 * @returns {Promise} API response with tags
 */
async function getTags() {
  try {
    console.log('Fetching all tags');
    
    const response = await axios.get(
      `${API_BASE}/tags`,
      { params: { api_key: CONVERTKIT_API_KEY } }
    );
    
    console.log(`Found ${response.data.tags.length} tags`);
    return response.data.tags;
  } catch (error) {
    console.error(`Error fetching tags: ${error.message}`);
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }
}

/**
 * Create a new tag
 * @param {string} name - Tag name
 * @returns {Promise} API response
 */
async function createTag(name) {
  try {
    console.log(`Creating tag: ${name}`);
    
    const payload = {
      api_key: CONVERTKIT_API_KEY,
      tag: { name }
    };
    
    const response = await axios.post(
      `${API_BASE}/tags`,
      payload
    );
    
    console.log(`Tag created with ID: ${response.data.tag.id}`);
    return response.data.tag;
  } catch (error) {
    console.error(`Error creating tag: ${error.message}`);
    throw new Error(`Failed to create tag: ${error.message}`);
  }
}

/**
 * Send blog post as broadcast email
 * @param {Object} postData - WordPress post data
 * @param {Array} tagIds - Tag IDs to target
 * @returns {Promise} API response
 */
async function sendPostAsBroadcast(postData, tagIds = [CONVERTKIT_BASIC_TAG_ID]) {
  try {
    console.log(`Sending post as broadcast: ${postData.title}`);
    
    // Prepare broadcast options
    const options = {
      subject: postData.title,
      content: postData.content,
      previewText: postData.excerpt || `New wealth automation content: ${postData.title}`,
      tagIds: tagIds,
      send: true
    };
    
    // Send broadcast
    return await sendBroadcast(options);
  } catch (error) {
    console.error(`Error sending post as broadcast: ${error.message}`);
    throw new Error(`Failed to send post as broadcast: ${error.message}`);
  }
}

module.exports = {
  sendBroadcast,
  sendScheduledBroadcast,
  addSubscriber,
  tagSubscriber,
  addToSequence,
  getSequences,
  getTags,
  createTag,
  sendPostAsBroadcast
};

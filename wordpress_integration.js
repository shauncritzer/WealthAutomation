/**
 * WordPress Integration for WealthAutomationHQ
 * 
 * This module handles all WordPress API interactions for blog posts,
 * pages, and media management.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Environment variables
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL;
const WORDPRESS_USER = process.env.WORDPRESS_USER;
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

/**
 * Create a new blog post
 * @param {Object} postData - Post data
 * @returns {Promise} API response
 */
async function createPost(postData) {
  try {
    console.log(`Creating post: ${postData.title}`);
    
    // Prepare post data
    const payload = {
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt || '',
      status: postData.status || 'publish',
      categories: postData.categories || [],
      tags: postData.tags || [],
      featured_media: postData.featuredMedia || 0
    };
    
    // Call WordPress API
    const response = await axios.post(
      `${WORDPRESS_API_URL}/wp/v2/posts`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: WORDPRESS_USER,
          password: WORDPRESS_APP_PASSWORD
        }
      }
    );
    
    console.log(`Post created with ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating post: ${error.message}`);
    if (error.response) {
      console.error(`WordPress API response: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to create post: ${error.message}`);
  }
}

/**
 * Update an existing blog post
 * @param {number} postId - Post ID
 * @param {Object} postData - Post data
 * @returns {Promise} API response
 */
async function updatePost(postId, postData) {
  try {
    console.log(`Updating post ${postId}`);
    
    // Prepare post data
    const payload = {};
    if (postData.title) payload.title = postData.title;
    if (postData.content) payload.content = postData.content;
    if (postData.excerpt) payload.excerpt = postData.excerpt;
    if (postData.status) payload.status = postData.status;
    if (postData.categories) payload.categories = postData.categories;
    if (postData.tags) payload.tags = postData.tags;
    if (postData.featuredMedia) payload.featured_media = postData.featuredMedia;
    
    // Call WordPress API
    const response = await axios.post(
      `${WORDPRESS_API_URL}/wp/v2/posts/${postId}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: WORDPRESS_USER,
          password: WORDPRESS_APP_PASSWORD
        }
      }
    );
    
    console.log(`Post ${postId} updated successfully`);
    return response.data;
  } catch (error) {
    console.error(`Error updating post: ${error.message}`);
    throw new Error(`Failed to update post: ${error.message}`);
  }
}

/**
 * Get a blog post by ID
 * @param {number} postId - Post ID
 * @returns {Promise} API response
 */
async function getPost(postId) {
  try {
    console.log(`Fetching post ${postId}`);
    
    const response = await axios.get(
      `${WORDPRESS_API_URL}/wp/v2/posts/${postId}`,
      {
        auth: {
          username: WORDPRESS_USER,
          password: WORDPRESS_APP_PASSWORD
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching post: ${error.message}`);
    throw new Error(`Failed to fetch post: ${error.message}`);
  }
}

/**
 * Get recent blog posts
 * @param {Object} options - Query options
 * @returns {Promise} API response
 */
async function getRecentPosts(options = {}) {
  try {
    console.log('Fetching recent posts');
    
    const params = {
      per_page: options.perPage || 10,
      page: options.page || 1,
      order: options.order || 'desc',
      orderby: options.orderby || 'date'
    };
    
    if (options.categories) params.categories = options.categories;
    if (options.tags) params.tags = options.tags;
    if (options.search) params.search = options.search;
    
    const response = await axios.get(
      `${WORDPRESS_API_URL}/wp/v2/posts`,
      {
        params,
        auth: {
          username: WORDPRESS_USER,
          password: WORDPRESS_APP_PASSWORD
        }
      }
    );
    
    console.log(`Fetched ${response.data.length} posts`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recent posts: ${error.message}`);
    throw new Error(`Failed to fetch recent posts: ${error.message}`);
  }
}

/**
 * Upload media to WordPress
 * @param {string} filePath - Path to file
 * @param {Object} options - Upload options
 * @returns {Promise} API response
 */
async function uploadMedia(filePath, options = {}) {
  try {
    console.log(`Uploading media: ${filePath}`);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    if (options.title) formData.append('title', options.title);
    if (options.caption) formData.append('caption', options.caption);
    if (options.alt_text) formData.append('alt_text', options.alt_text);
    
    // Call WordPress API
    const response = await axios.post(
      `${WORDPRESS_API_URL}/wp/v2/media`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
        },
        auth: {
          username: WORDPRESS_USER,
          password: WORDPRESS_APP_PASSWORD
        }
      }
    );
    
    console.log(`Media uploaded with ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`Error uploading media: ${error.message}`);
    throw new Error(`Failed to upload media: ${error.message}`);
  }
}

/**
 * Get categories
 * @returns {Promise} API response
 */
async function getCategories() {
  try {
    console.log('Fetching categories');
    
    const response = await axios.get(
      `${WORDPRESS_API_URL}/wp/v2/categories`,
      {
        params: {
          per_page: 100
        },
        auth: {
          username: WORDPRESS_USER,
          password: WORDPRESS_APP_PASSWORD
        }
      }
    );
    
    console.log(`Fetched ${response.data.length} categories`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching categories: ${error.message}`);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
}

/**
 * Create a category
 * @param {string} name - Category name
 * @param {Object} options - Category options
 * @returns {Promise} API response
 */
async function createCategory(name, options = {}) {
  try {
    console.log(`Creating category: ${name}`);
    
    const payload = {
      name: name,
      description: options.description || ''
    };
    
    if (options.parent) payload.parent = options.parent;
    
    const response = await axios.post(
      `${WORDPRESS_API_URL}/wp/v2/categories`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: WORDPRESS_USER,
          password: WORDPRESS_APP_PASSWORD
        }
      }
    );
    
    console.log(`Category created with ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating category: ${error.message}`);
    throw new Error(`Failed to create category: ${error.message}`);
  }
}

/**
 * Check WordPress connection
 * @returns {Promise<boolean>} Connection status
 */
async function checkConnection() {
  try {
    console.log('Checking WordPress connection');
    
    const response = await axios.get(
      `${WORDPRESS_API_URL}/wp/v2/users/me`,
      {
        auth: {
          username: WORDPRESS_USER,
          password: WORDPRESS_APP_PASSWORD
        }
      }
    );
    
    console.log(`WordPress connection successful. User: ${response.data.name}`);
    return true;
  } catch (error) {
    console.error(`WordPress connection failed: ${error.message}`);
    return false;
  }
}

module.exports = {
  createPost,
  updatePost,
  getPost,
  getRecentPosts,
  uploadMedia,
  getCategories,
  createCategory,
  checkConnection
};

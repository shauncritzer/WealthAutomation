/**
 * WordPress Integration Module for WealthAutomation
 * Handles automated posting to WordPress sites
 */

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class WordPressIntegration {
    constructor() {
        this.wordpressUrl = process.env.WORDPRESS_URL;
        this.username = process.env.WORDPRESS_USERNAME;
        this.appPassword = process.env.WORDPRESS_APP_PASSWORD;
        
        if (!this.wordpressUrl || !this.username || !this.appPassword) {
            console.warn('WordPress credentials not fully configured. Posts will be simulated.');
        }
        
        // Create base64 encoded credentials for WordPress REST API
        this.credentials = Buffer.from(`${this.username}:${this.appPassword}`).toString('base64');
        
        // Ensure URL ends with /wp-json/wp/v2
        if (this.wordpressUrl && !this.wordpressUrl.includes('/wp-json/wp/v2')) {
            this.apiUrl = `${this.wordpressUrl.replace(/\/$/, '')}/wp-json/wp/v2`;
        } else {
            this.apiUrl = this.wordpressUrl;
        }
    }

    async createPost(postData) {
        try {
            if (!this.wordpressUrl) {
                return this.simulatePost(postData);
            }

            const {
                title,
                content,
                status = 'draft',
                categories = [],
                tags = [],
                featuredImage = null,
                excerpt = '',
                slug = ''
            } = postData;

            // Prepare post data for WordPress API
            const wpPostData = {
                title: title,
                content: content,
                status: status,
                excerpt: excerpt,
                slug: slug || this.generateSlug(title),
                categories: await this.getCategoryIds(categories),
                tags: await this.getTagIds(tags),
                meta: {
                    _generated_by: 'WealthAutomation AI',
                    _generation_date: new Date().toISOString()
                }
            };

            // Add featured image if provided
            if (featuredImage) {
                wpPostData.featured_media = await this.uploadFeaturedImage(featuredImage);
            }

            const response = await axios.post(`${this.apiUrl}/posts`, wpPostData, {
                headers: {
                    'Authorization': `Basic ${this.credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                postId: response.data.id,
                postUrl: response.data.link,
                status: response.data.status,
                title: response.data.title.rendered,
                publishedAt: response.data.date,
                message: 'Post created successfully'
            };

        } catch (error) {
            console.error('WordPress post creation failed:', error.message);
            
            // If WordPress fails, simulate the post for logging
            const simulatedResult = this.simulatePost(postData);
            
            return {
                success: false,
                error: error.message,
                simulated: simulatedResult,
                message: 'WordPress posting failed, but content was generated successfully'
            };
        }
    }

    async updatePost(postId, updateData) {
        try {
            if (!this.wordpressUrl) {
                return {
                    success: false,
                    error: 'WordPress not configured',
                    message: 'Post update simulated'
                };
            }

            const response = await axios.post(`${this.apiUrl}/posts/${postId}`, updateData, {
                headers: {
                    'Authorization': `Basic ${this.credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                postId: response.data.id,
                postUrl: response.data.link,
                status: response.data.status,
                message: 'Post updated successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Post update failed'
            };
        }
    }

    async getCategoryIds(categoryNames) {
        if (!categoryNames || categoryNames.length === 0) {
            return [];
        }

        try {
            const categoryIds = [];
            
            for (const categoryName of categoryNames) {
                // First, try to find existing category
                const searchResponse = await axios.get(`${this.apiUrl}/categories`, {
                    params: { search: categoryName },
                    headers: {
                        'Authorization': `Basic ${this.credentials}`
                    }
                });

                if (searchResponse.data.length > 0) {
                    categoryIds.push(searchResponse.data[0].id);
                } else {
                    // Create new category if it doesn't exist
                    const createResponse = await axios.post(`${this.apiUrl}/categories`, {
                        name: categoryName,
                        slug: this.generateSlug(categoryName)
                    }, {
                        headers: {
                            'Authorization': `Basic ${this.credentials}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    categoryIds.push(createResponse.data.id);
                }
            }

            return categoryIds;

        } catch (error) {
            console.error('Category processing failed:', error.message);
            return [];
        }
    }

    async getTagIds(tagNames) {
        if (!tagNames || tagNames.length === 0) {
            return [];
        }

        try {
            const tagIds = [];
            
            for (const tagName of tagNames) {
                // First, try to find existing tag
                const searchResponse = await axios.get(`${this.apiUrl}/tags`, {
                    params: { search: tagName },
                    headers: {
                        'Authorization': `Basic ${this.credentials}`
                    }
                });

                if (searchResponse.data.length > 0) {
                    tagIds.push(searchResponse.data[0].id);
                } else {
                    // Create new tag if it doesn't exist
                    const createResponse = await axios.post(`${this.apiUrl}/tags`, {
                        name: tagName,
                        slug: this.generateSlug(tagName)
                    }, {
                        headers: {
                            'Authorization': `Basic ${this.credentials}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    tagIds.push(createResponse.data.id);
                }
            }

            return tagIds;

        } catch (error) {
            console.error('Tag processing failed:', error.message);
            return [];
        }
    }

    async uploadFeaturedImage(imageUrl) {
        try {
            // Download image
            const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer'
            });

            // Upload to WordPress media library
            const uploadResponse = await axios.post(`${this.apiUrl}/media`, imageResponse.data, {
                headers: {
                    'Authorization': `Basic ${this.credentials}`,
                    'Content-Type': 'image/jpeg',
                    'Content-Disposition': 'attachment; filename="featured-image.jpg"'
                }
            });

            return uploadResponse.data.id;

        } catch (error) {
            console.error('Featured image upload failed:', error.message);
            return null;
        }
    }

    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    simulatePost(postData) {
        const simulatedId = Math.floor(Math.random() * 10000) + 1000;
        const simulatedSlug = this.generateSlug(postData.title);
        
        return {
            success: true,
            simulated: true,
            postId: simulatedId,
            postUrl: `https://example.com/${simulatedSlug}`,
            status: postData.status || 'draft',
            title: postData.title,
            publishedAt: new Date().toISOString(),
            message: 'Post simulated successfully (WordPress not configured)'
        };
    }

    async getRecentPosts(limit = 10) {
        try {
            if (!this.wordpressUrl) {
                return {
                    success: false,
                    error: 'WordPress not configured'
                };
            }

            const response = await axios.get(`${this.apiUrl}/posts`, {
                params: {
                    per_page: limit,
                    orderby: 'date',
                    order: 'desc'
                },
                headers: {
                    'Authorization': `Basic ${this.credentials}`
                }
            });

            return {
                success: true,
                posts: response.data.map(post => ({
                    id: post.id,
                    title: post.title.rendered,
                    url: post.link,
                    status: post.status,
                    publishedAt: post.date,
                    excerpt: post.excerpt.rendered
                }))
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async testConnection() {
        try {
            if (!this.wordpressUrl) {
                return {
                    success: false,
                    error: 'WordPress credentials not configured',
                    message: 'Please set WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD environment variables'
                };
            }

            const response = await axios.get(`${this.apiUrl}/posts`, {
                params: { per_page: 1 },
                headers: {
                    'Authorization': `Basic ${this.credentials}`
                }
            });

            return {
                success: true,
                message: 'WordPress connection successful',
                siteInfo: {
                    url: this.wordpressUrl,
                    apiUrl: this.apiUrl,
                    postsFound: response.data.length
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'WordPress connection failed'
            };
        }
    }
}

module.exports = {
    createPost: async (postData) => {
        const wp = new WordPressIntegration();
        return await wp.createPost(postData);
    },
    
    updatePost: async (postId, updateData) => {
        const wp = new WordPressIntegration();
        return await wp.updatePost(postId, updateData);
    },
    
    getRecentPosts: async (limit = 10) => {
        const wp = new WordPressIntegration();
        return await wp.getRecentPosts(limit);
    },
    
    testConnection: async () => {
        const wp = new WordPressIntegration();
        return await wp.testConnection();
    },
    
    WordPressIntegration
};


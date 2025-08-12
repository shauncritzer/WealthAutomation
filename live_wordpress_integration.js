/**
 * WordPress Integration Module for WealthAutomationHQ
 * Live API integration with JWT authentication
 */

const axios = require('axios');
const FormData = require('form-data');

class WordPressIntegration {
    constructor() {
        this.baseUrl = 'https://wealthautomationhq.com';
        this.username = 'wealthauto';
        this.password = process.env.WP_PASSWORD || 'testuser'; // Will use JWT token instead
        this.jwtToken = null;
        this.tokenExpiry = null;
    }

    async authenticate() {
        try {
            const response = await axios.post(`${this.baseUrl}/wp-json/jwt-auth/v1/token`, {
                username: this.username,
                password: this.password
            });

            if (response.data.token) {
                this.jwtToken = response.data.token;
                this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
                console.log('WordPress JWT authentication successful');
                return true;
            }
        } catch (error) {
            console.error('WordPress authentication failed:', error.response?.data || error.message);
            return false;
        }
    }

    async ensureAuthenticated() {
        if (!this.jwtToken || Date.now() > this.tokenExpiry) {
            return await this.authenticate();
        }
        return true;
    }

    async createPost(postData) {
        try {
            const authenticated = await this.ensureAuthenticated();
            if (!authenticated) {
                throw new Error('WordPress authentication failed');
            }

            // Prepare post data
            const wpPostData = {
                title: postData.title,
                content: postData.content,
                status: postData.status || 'publish',
                categories: postData.categories || [1], // Default to Uncategorized
                tags: postData.tags || [],
                excerpt: postData.excerpt || '',
                meta: {
                    _yoast_wpseo_title: postData.seoTitle || postData.title,
                    _yoast_wpseo_metadesc: postData.seoDescription || postData.excerpt
                }
            };

            const response = await axios.post(
                `${this.baseUrl}/wp-json/wp/v2/posts`,
                wpPostData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.jwtToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('WordPress post created successfully:', response.data.id);
            return {
                success: true,
                id: response.data.id,
                url: response.data.link,
                title: response.data.title.rendered,
                status: response.data.status
            };

        } catch (error) {
            console.error('WordPress post creation failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async updatePost(postId, postData) {
        try {
            const authenticated = await this.ensureAuthenticated();
            if (!authenticated) {
                throw new Error('WordPress authentication failed');
            }

            const response = await axios.post(
                `${this.baseUrl}/wp-json/wp/v2/posts/${postId}`,
                postData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.jwtToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                id: response.data.id,
                url: response.data.link
            };

        } catch (error) {
            console.error('WordPress post update failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async uploadMedia(mediaData) {
        try {
            const authenticated = await this.ensureAuthenticated();
            if (!authenticated) {
                throw new Error('WordPress authentication failed');
            }

            const formData = new FormData();
            formData.append('file', mediaData.buffer, {
                filename: mediaData.filename,
                contentType: mediaData.mimetype
            });

            const response = await axios.post(
                `${this.baseUrl}/wp-json/wp/v2/media`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.jwtToken}`,
                        ...formData.getHeaders()
                    }
                }
            );

            return {
                success: true,
                id: response.data.id,
                url: response.data.source_url,
                title: response.data.title.rendered
            };

        } catch (error) {
            console.error('WordPress media upload failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async getCategories() {
        try {
            const response = await axios.get(`${this.baseUrl}/wp-json/wp/v2/categories`);
            return response.data.map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug
            }));
        } catch (error) {
            console.error('Failed to get categories:', error.message);
            return [];
        }
    }

    async createCategory(name, description = '') {
        try {
            const authenticated = await this.ensureAuthenticated();
            if (!authenticated) {
                throw new Error('WordPress authentication failed');
            }

            const response = await axios.post(
                `${this.baseUrl}/wp-json/wp/v2/categories`,
                {
                    name: name,
                    description: description
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.jwtToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                id: response.data.id,
                name: response.data.name,
                slug: response.data.slug
            };

        } catch (error) {
            console.error('Category creation failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async getPosts(limit = 10) {
        try {
            const response = await axios.get(`${this.baseUrl}/wp-json/wp/v2/posts?per_page=${limit}`);
            return response.data.map(post => ({
                id: post.id,
                title: post.title.rendered,
                url: post.link,
                date: post.date,
                status: post.status
            }));
        } catch (error) {
            console.error('Failed to get posts:', error.message);
            return [];
        }
    }

    // Helper method to format content with affiliate offers
    formatContentWithAffiliate(content, affiliateOffer) {
        if (!affiliateOffer) return content;

        const affiliateCTA = `
<div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 8px;">
    <h3 style="color: #667eea; margin-bottom: 15px;">🚀 Ready to Take Action?</h3>
    <p style="margin-bottom: 15px;">${affiliateOffer.description}</p>
    <p><a href="${affiliateOffer.url}" target="_blank" rel="noopener" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Get Started with ${affiliateOffer.name} →</a></p>
    <p style="font-size: 12px; color: #666; margin-top: 10px;"><em>Disclosure: This post contains affiliate links. I may earn a commission if you make a purchase through these links, at no additional cost to you.</em></p>
</div>`;

        // Insert CTA before the last paragraph or at the end
        const paragraphs = content.split('\n\n');
        if (paragraphs.length > 2) {
            paragraphs.splice(-1, 0, affiliateCTA);
            return paragraphs.join('\n\n');
        } else {
            return content + '\n\n' + affiliateCTA;
        }
    }

    // Generate SEO-optimized excerpt
    generateExcerpt(content, maxLength = 160) {
        // Remove HTML tags and get plain text
        const plainText = content.replace(/<[^>]*>/g, '').replace(/\n+/g, ' ').trim();
        
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
}

module.exports = {
    createPost: async (postData) => {
        const wp = new WordPressIntegration();
        return await wp.createPost(postData);
    },
    
    updatePost: async (postId, postData) => {
        const wp = new WordPressIntegration();
        return await wp.updatePost(postId, postData);
    },
    
    uploadMedia: async (mediaData) => {
        const wp = new WordPressIntegration();
        return await wp.uploadMedia(mediaData);
    },
    
    getCategories: async () => {
        const wp = new WordPressIntegration();
        return await wp.getCategories();
    },
    
    createCategory: async (name, description) => {
        const wp = new WordPressIntegration();
        return await wp.createCategory(name, description);
    },
    
    getPosts: async (limit) => {
        const wp = new WordPressIntegration();
        return await wp.getPosts(limit);
    },
    
    WordPressIntegration
};


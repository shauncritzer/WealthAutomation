/**
 * ConvertKit Integration Module for WealthAutomationHQ
 * Live API integration with V4 API
 */

const axios = require('axios');

class ConvertKitIntegration {
    constructor() {
        this.apiKey = 'kit_2291ec06896942a3c8299a9e26714349';
        this.apiSecret = 'x9Uzt8Xs2179XCHdJ6vZrb_-sq12AGihK_sxmuqK3ZY';
        this.baseUrl = 'https://api.kit.com/v4';
        this.defaultFormId = '7837546'; // Passive Affiliate SLO Opt-In
    }

    async makeRequest(method, endpoint, data = null) {
        try {
            const config = {
                method,
                url: `${this.baseUrl}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return {
                success: true,
                data: response.data
            };

        } catch (error) {
            console.error(`ConvertKit API error (${method} ${endpoint}):`, error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    async addSubscriber(email, firstName = '', lastName = '', formId = null) {
        try {
            const targetFormId = formId || this.defaultFormId;
            
            const subscriberData = {
                email: email,
                first_name: firstName,
                last_name: lastName,
                state: 'active'
            };

            // Add subscriber to form
            const result = await this.makeRequest('POST', `/forms/${targetFormId}/subscribers`, subscriberData);
            
            if (result.success) {
                console.log('ConvertKit subscriber added successfully:', email);
                return {
                    success: true,
                    subscriber: result.data.subscriber,
                    formId: targetFormId
                };
            } else {
                return result;
            }

        } catch (error) {
            console.error('ConvertKit add subscriber failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createBroadcast(subject, content, description = '', sendAt = null) {
        try {
            const broadcastData = {
                subject: subject,
                content: content,
                description: description || `Automated broadcast: ${subject}`,
                public: false
            };

            if (sendAt) {
                broadcastData.send_at = sendAt;
            }

            const result = await this.makeRequest('POST', '/broadcasts', broadcastData);
            
            if (result.success) {
                console.log('ConvertKit broadcast created successfully:', result.data.broadcast.id);
                return {
                    success: true,
                    broadcast: result.data.broadcast,
                    id: result.data.broadcast.id
                };
            } else {
                return result;
            }

        } catch (error) {
            console.error('ConvertKit create broadcast failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendBroadcast(broadcastId) {
        try {
            const result = await this.makeRequest('POST', `/broadcasts/${broadcastId}/send`);
            
            if (result.success) {
                console.log('ConvertKit broadcast sent successfully:', broadcastId);
                return {
                    success: true,
                    broadcast: result.data.broadcast
                };
            } else {
                return result;
            }

        } catch (error) {
            console.error('ConvertKit send broadcast failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createAndSendBroadcast(subject, content, description = '') {
        try {
            // Create broadcast
            const createResult = await this.createBroadcast(subject, content, description);
            
            if (!createResult.success) {
                return createResult;
            }

            // Send broadcast immediately
            const sendResult = await this.sendBroadcast(createResult.id);
            
            return {
                success: sendResult.success,
                broadcast: createResult.broadcast,
                sent: sendResult.success,
                error: sendResult.error
            };

        } catch (error) {
            console.error('ConvertKit create and send broadcast failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getSubscribers(page = 1, limit = 50) {
        try {
            const result = await this.makeRequest('GET', `/subscribers?page=${page}&per_page=${limit}`);
            
            if (result.success) {
                return {
                    success: true,
                    subscribers: result.data.subscribers,
                    pagination: result.data.pagination
                };
            } else {
                return result;
            }

        } catch (error) {
            console.error('ConvertKit get subscribers failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getForms() {
        try {
            const result = await this.makeRequest('GET', '/forms');
            
            if (result.success) {
                return {
                    success: true,
                    forms: result.data.forms
                };
            } else {
                return result;
            }

        } catch (error) {
            console.error('ConvertKit get forms failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getBroadcasts(page = 1, limit = 50) {
        try {
            const result = await this.makeRequest('GET', `/broadcasts?page=${page}&per_page=${limit}`);
            
            if (result.success) {
                return {
                    success: true,
                    broadcasts: result.data.broadcasts,
                    pagination: result.data.pagination
                };
            } else {
                return result;
            }

        } catch (error) {
            console.error('ConvertKit get broadcasts failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async tagSubscriber(subscriberId, tagId) {
        try {
            const result = await this.makeRequest('POST', `/subscribers/${subscriberId}/tags`, {
                tag: { id: tagId }
            });
            
            if (result.success) {
                console.log('ConvertKit subscriber tagged successfully:', subscriberId, tagId);
                return {
                    success: true,
                    subscriber: result.data.subscriber
                };
            } else {
                return result;
            }

        } catch (error) {
            console.error('ConvertKit tag subscriber failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper method to format blog content for email
    formatContentForEmail(blogContent, blogUrl, affiliateOffer) {
        const emailContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">WealthAutomationHQ</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Building Wealth Through Smart Automation</p>
    </div>
    
    <div style="padding: 30px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hey there,</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">I just published a new post that I think you'll find valuable. Here's a preview:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${this.extractEmailPreview(blogContent)}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${blogUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Read the Full Post →</a>
        </div>
        
        ${affiliateOffer ? this.formatAffiliateOfferForEmail(affiliateOffer) : ''}
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Talk soon,<br><strong>Shaun Critzer</strong></p>
            <p style="font-size: 14px; color: #666;">Founder, WealthAutomationHQ</p>
        </div>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>You're receiving this because you subscribed to WealthAutomationHQ updates.</p>
        <p><a href="{{unsubscribe_url}}" style="color: #667eea;">Unsubscribe</a> | <a href="https://wealthautomationhq.com" style="color: #667eea;">Visit Website</a></p>
    </div>
</div>`;

        return emailContent;
    }

    extractEmailPreview(content, maxLength = 300) {
        // Remove HTML tags and get plain text
        const plainText = content.replace(/<[^>]*>/g, '').replace(/\n+/g, ' ').trim();
        
        if (plainText.length <= maxLength) {
            return `<p style="font-style: italic; color: #555;">${plainText}</p>`;
        }

        // Find the last complete sentence within the limit
        const truncated = plainText.substring(0, maxLength);
        const lastSentence = truncated.lastIndexOf('.');
        
        if (lastSentence > maxLength * 0.7) {
            return `<p style="font-style: italic; color: #555;">${truncated.substring(0, lastSentence + 1)}</p>`;
        }
        
        // If no good sentence break, truncate at word boundary
        const lastSpace = truncated.lastIndexOf(' ');
        return `<p style="font-style: italic; color: #555;">${truncated.substring(0, lastSpace)}...</p>`;
    }

    formatAffiliateOfferForEmail(offer) {
        return `
<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #856404; margin-bottom: 15px;">🚀 Recommended Resource</h3>
    <p style="margin-bottom: 15px; color: #856404;">${offer.description}</p>
    <div style="text-align: center;">
        <a href="${offer.url}" target="_blank" style="background: #856404; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Check Out ${offer.name} →</a>
    </div>
    <p style="font-size: 11px; color: #6c757d; margin-top: 15px; text-align: center;"><em>This email contains affiliate links. I may earn a commission if you make a purchase.</em></p>
</div>`;
    }

    // Generate email subject lines
    generateSubjectLine(blogTitle, type = 'default') {
        const subjects = {
            default: [
                `New post: ${blogTitle}`,
                `Just published: ${blogTitle}`,
                `Fresh insights: ${blogTitle}`
            ],
            personal: [
                `My latest thoughts on ${blogTitle.toLowerCase()}`,
                `Something I wanted to share: ${blogTitle}`,
                `Quick update: ${blogTitle}`
            ],
            urgent: [
                `Don't miss this: ${blogTitle}`,
                `Important update: ${blogTitle}`,
                `Time-sensitive: ${blogTitle}`
            ]
        };

        const options = subjects[type] || subjects.default;
        return options[Math.floor(Math.random() * options.length)];
    }
}

module.exports = {
    addSubscriber: async (email, firstName, lastName, formId) => {
        const ck = new ConvertKitIntegration();
        return await ck.addSubscriber(email, firstName, lastName, formId);
    },
    
    createBroadcast: async (subject, content, description) => {
        const ck = new ConvertKitIntegration();
        return await ck.createBroadcast(subject, content, description);
    },
    
    sendBroadcast: async (broadcastId) => {
        const ck = new ConvertKitIntegration();
        return await ck.sendBroadcast(broadcastId);
    },
    
    createAndSendBroadcast: async (subject, content, description) => {
        const ck = new ConvertKitIntegration();
        return await ck.createAndSendBroadcast(subject, content, description);
    },
    
    getSubscribers: async (page, limit) => {
        const ck = new ConvertKitIntegration();
        return await ck.getSubscribers(page, limit);
    },
    
    getForms: async () => {
        const ck = new ConvertKitIntegration();
        return await ck.getForms();
    },
    
    getBroadcasts: async (page, limit) => {
        const ck = new ConvertKitIntegration();
        return await ck.getBroadcasts(page, limit);
    },
    
    ConvertKitIntegration
};


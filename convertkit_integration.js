/**
 * ConvertKit Integration Module for WealthAutomation
 * Handles email marketing automation and subscriber management
 */

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class ConvertKitIntegration {
    constructor() {
        this.apiKey = process.env.CONVERTKIT_API_KEY;
        this.apiSecret = process.env.CONVERTKIT_API_SECRET;
        this.baseUrl = 'https://api.convertkit.com/v3';
        
        if (!this.apiKey) {
            console.warn('ConvertKit API key not configured. Email operations will be simulated.');
        }
    }

    async sendEmail(emailData) {
        try {
            if (!this.apiKey) {
                return this.simulateEmail(emailData);
            }

            const {
                subject,
                content,
                segmentId = null,
                subscriberEmail = null,
                templateId = null
            } = emailData;

            let response;

            if (subscriberEmail) {
                // Send to specific subscriber
                response = await this.sendToSubscriber(subscriberEmail, subject, content);
            } else if (segmentId) {
                // Send to segment
                response = await this.sendToSegment(segmentId, subject, content);
            } else {
                // Send broadcast to all subscribers
                response = await this.sendBroadcast(subject, content);
            }

            return {
                success: true,
                emailId: response.broadcast?.id || response.id,
                subject: subject,
                sentAt: new Date().toISOString(),
                message: 'Email sent successfully'
            };

        } catch (error) {
            console.error('ConvertKit email sending failed:', error.message);
            
            return {
                success: false,
                error: error.message,
                simulated: this.simulateEmail(emailData),
                message: 'Email sending failed, but content was generated successfully'
            };
        }
    }

    async sendBroadcast(subject, content) {
        try {
            const response = await axios.post(`${this.baseUrl}/broadcasts`, {
                api_key: this.apiKey,
                subject: subject,
                content: content,
                description: `Automated broadcast - ${new Date().toISOString()}`,
                public: false,
                published: true
            });

            return response.data;

        } catch (error) {
            throw new Error(`Broadcast failed: ${error.message}`);
        }
    }

    async sendToSegment(segmentId, subject, content) {
        try {
            const response = await axios.post(`${this.baseUrl}/broadcasts`, {
                api_key: this.apiKey,
                subject: subject,
                content: content,
                description: `Automated segment email - ${new Date().toISOString()}`,
                segment_id: segmentId,
                public: false,
                published: true
            });

            return response.data;

        } catch (error) {
            throw new Error(`Segment email failed: ${error.message}`);
        }
    }

    async sendToSubscriber(email, subject, content) {
        try {
            // First get subscriber ID
            const subscriber = await this.getSubscriber(email);
            
            if (!subscriber) {
                throw new Error('Subscriber not found');
            }

            const response = await axios.post(`${this.baseUrl}/subscribers/${subscriber.id}/email`, {
                api_key: this.apiKey,
                subject: subject,
                content: content
            });

            return response.data;

        } catch (error) {
            throw new Error(`Individual email failed: ${error.message}`);
        }
    }

    async addSubscriber(subscriberData) {
        try {
            if (!this.apiKey) {
                return this.simulateSubscriber(subscriberData);
            }

            const {
                email,
                firstName = '',
                lastName = '',
                tags = [],
                customFields = {}
            } = subscriberData;

            const response = await axios.post(`${this.baseUrl}/subscribers`, {
                api_key: this.apiKey,
                email: email,
                first_name: firstName,
                last_name: lastName,
                fields: customFields
            });

            const subscriberId = response.data.subscriber.id;

            // Add tags if provided
            if (tags.length > 0) {
                await this.addTagsToSubscriber(subscriberId, tags);
            }

            return {
                success: true,
                subscriberId: subscriberId,
                email: email,
                message: 'Subscriber added successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Failed to add subscriber'
            };
        }
    }

    async getSubscriber(email) {
        try {
            const response = await axios.get(`${this.baseUrl}/subscribers`, {
                params: {
                    api_key: this.apiKey,
                    email_address: email
                }
            });

            return response.data.subscribers[0] || null;

        } catch (error) {
            console.error('Failed to get subscriber:', error.message);
            return null;
        }
    }

    async addTagsToSubscriber(subscriberId, tags) {
        try {
            for (const tag of tags) {
                await axios.post(`${this.baseUrl}/subscribers/${subscriberId}/tags`, {
                    api_key: this.apiKey,
                    tag: tag
                });
            }

            return {
                success: true,
                message: 'Tags added successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createSequence(sequenceData) {
        try {
            if (!this.apiKey) {
                return this.simulateSequence(sequenceData);
            }

            const {
                name,
                emails = []
            } = sequenceData;

            const response = await axios.post(`${this.baseUrl}/sequences`, {
                api_key: this.apiKey,
                name: name,
                description: `Automated sequence created ${new Date().toISOString()}`
            });

            const sequenceId = response.data.sequence.id;

            // Add emails to sequence
            for (let i = 0; i < emails.length; i++) {
                await this.addEmailToSequence(sequenceId, emails[i], i);
            }

            return {
                success: true,
                sequenceId: sequenceId,
                name: name,
                emailCount: emails.length,
                message: 'Sequence created successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Failed to create sequence'
            };
        }
    }

    async addEmailToSequence(sequenceId, emailData, delay = 0) {
        try {
            const response = await axios.post(`${this.baseUrl}/sequences/${sequenceId}/emails`, {
                api_key: this.apiKey,
                subject: emailData.subject,
                content: emailData.content,
                delay: delay
            });

            return response.data;

        } catch (error) {
            throw new Error(`Failed to add email to sequence: ${error.message}`);
        }
    }

    async getSubscriberStats() {
        try {
            if (!this.apiKey) {
                return this.simulateStats();
            }

            const response = await axios.get(`${this.baseUrl}/subscribers`, {
                params: {
                    api_key: this.apiKey,
                    per_page: 1
                }
            });

            const totalSubscribers = response.data.total_subscribers;

            return {
                success: true,
                totalSubscribers: totalSubscribers,
                retrievedAt: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getRecentBroadcasts(limit = 10) {
        try {
            if (!this.apiKey) {
                return { success: false, error: 'ConvertKit not configured' };
            }

            const response = await axios.get(`${this.baseUrl}/broadcasts`, {
                params: {
                    api_key: this.apiKey,
                    per_page: limit
                }
            });

            return {
                success: true,
                broadcasts: response.data.broadcasts.map(broadcast => ({
                    id: broadcast.id,
                    subject: broadcast.subject,
                    sentAt: broadcast.created_at,
                    stats: {
                        recipients: broadcast.total_recipients,
                        opens: broadcast.open_rate,
                        clicks: broadcast.click_rate
                    }
                }))
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    simulateEmail(emailData) {
        return {
            success: true,
            simulated: true,
            emailId: Math.floor(Math.random() * 100000),
            subject: emailData.subject,
            sentAt: new Date().toISOString(),
            message: 'Email simulated successfully (ConvertKit not configured)'
        };
    }

    simulateSubscriber(subscriberData) {
        return {
            success: true,
            simulated: true,
            subscriberId: Math.floor(Math.random() * 100000),
            email: subscriberData.email,
            message: 'Subscriber simulation successful (ConvertKit not configured)'
        };
    }

    simulateSequence(sequenceData) {
        return {
            success: true,
            simulated: true,
            sequenceId: Math.floor(Math.random() * 100000),
            name: sequenceData.name,
            emailCount: sequenceData.emails?.length || 0,
            message: 'Sequence simulation successful (ConvertKit not configured)'
        };
    }

    simulateStats() {
        return {
            success: true,
            simulated: true,
            totalSubscribers: Math.floor(Math.random() * 1000) + 100,
            retrievedAt: new Date().toISOString(),
            message: 'Stats simulation (ConvertKit not configured)'
        };
    }

    async testConnection() {
        try {
            if (!this.apiKey) {
                return {
                    success: false,
                    error: 'ConvertKit API key not configured',
                    message: 'Please set CONVERTKIT_API_KEY environment variable'
                };
            }

            const response = await axios.get(`${this.baseUrl}/account`, {
                params: {
                    api_key: this.apiKey
                }
            });

            return {
                success: true,
                message: 'ConvertKit connection successful',
                accountInfo: {
                    name: response.data.name,
                    plan: response.data.plan_type,
                    primaryEmailAddress: response.data.primary_email_address
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'ConvertKit connection failed'
            };
        }
    }
}

module.exports = {
    sendEmail: async (emailData) => {
        const ck = new ConvertKitIntegration();
        return await ck.sendEmail(emailData);
    },
    
    addSubscriber: async (subscriberData) => {
        const ck = new ConvertKitIntegration();
        return await ck.addSubscriber(subscriberData);
    },
    
    createSequence: async (sequenceData) => {
        const ck = new ConvertKitIntegration();
        return await ck.createSequence(sequenceData);
    },
    
    getSubscriberStats: async () => {
        const ck = new ConvertKitIntegration();
        return await ck.getSubscriberStats();
    },
    
    getRecentBroadcasts: async (limit = 10) => {
        const ck = new ConvertKitIntegration();
        return await ck.getRecentBroadcasts(limit);
    },
    
    testConnection: async () => {
        const ck = new ConvertKitIntegration();
        return await ck.testConnection();
    },
    
    ConvertKitIntegration
};


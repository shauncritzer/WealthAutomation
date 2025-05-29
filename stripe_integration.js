/**
 * Stripe Payment Integration for WealthAutomationHQ
 * 
 * This module handles Stripe payment processing, including:
 * - Payment link generation
 * - Subscription management
 * - Purchase tracking and reporting
 */

const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const fs = require('fs');
const path = require('path');

// Cache for payment links
let paymentLinksCache = {};

/**
 * Create a payment link for a product
 * @param {Object} product - Product information
 * @param {string} product.name - Product name
 * @param {number} product.price - Product price in cents
 * @param {string} product.description - Product description
 * @param {string} product.image - URL to product image
 * @param {string} product.successUrl - URL to redirect after successful payment
 * @param {string} product.cancelUrl - URL to redirect after canceled payment
 * @returns {Promise<string>} Payment link URL
 */
async function createPaymentLink(product) {
  try {
    console.log(`Creating payment link for product: ${product.name}`);
    
    // Check if we already have a cached payment link for this product
    const cacheKey = `${product.name}-${product.price}`;
    if (paymentLinksCache[cacheKey]) {
      console.log(`Using cached payment link for ${product.name}`);
      return paymentLinksCache[cacheKey];
    }
    
    // Create a product in Stripe
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      images: product.image ? [product.image] : undefined,
    });
    
    // Create a price for the product
    const price = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.price,
      currency: 'usd',
    });
    
    // Create a payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: product.successUrl || 'https://wealthautomationhq.com/thank-you',
        },
      },
    });
    
    // Cache the payment link
    paymentLinksCache[cacheKey] = paymentLink.url;
    
    console.log(`Created payment link: ${paymentLink.url}`);
    return paymentLink.url;
  } catch (error) {
    console.error(`Error creating payment link: ${error.message}`);
    // Return a fallback URL if there's an error
    return 'https://wealthautomationhq.com/products';
  }
}

/**
 * Get payment link for a product by name
 * @param {string} productName - Name of the product
 * @returns {Promise<string|null>} Payment link URL or null if not found
 */
async function getPaymentLinkByProductName(productName) {
  try {
    // Define product mapping
    const productMap = {
      'starter kit': {
        name: 'WealthAutomationHQ Starter Kit',
        price: 4700, // $47.00
        description: 'Get started with automated wealth building',
        successUrl: 'https://wealthautomationhq.com/thank-you-starter',
      },
      'pro system': {
        name: 'WealthAutomationHQ Pro System',
        price: 19700, // $197.00
        description: 'Advanced automation for serious wealth builders',
        successUrl: 'https://wealthautomationhq.com/thank-you-pro',
      },
      'agency license': {
        name: 'WealthAutomationHQ Agency License',
        price: 49700, // $497.00
        description: 'Full agency rights to WealthAutomationHQ',
        successUrl: 'https://wealthautomationhq.com/thank-you-agency',
      },
      'inner circle': {
        name: 'WealthAutomationHQ Inner Circle',
        price: 99700, // $997.00
        description: 'Elite membership with personal coaching',
        successUrl: 'https://wealthautomationhq.com/thank-you-inner-circle',
      },
    };
    
    // Find product by name (case insensitive)
    const productKey = Object.keys(productMap).find(key => 
      productName.toLowerCase().includes(key.toLowerCase())
    );
    
    if (!productKey) {
      console.log(`No product mapping found for: ${productName}`);
      return null;
    }
    
    const product = productMap[productKey];
    return await createPaymentLink(product);
  } catch (error) {
    console.error(`Error getting payment link: ${error.message}`);
    return null;
  }
}

/**
 * Track a purchase conversion
 * @param {Object} purchase - Purchase information
 * @param {string} purchase.productId - Product ID
 * @param {string} purchase.customerId - Customer ID
 * @param {number} purchase.amount - Purchase amount
 * @param {string} purchase.source - Source of the purchase (e.g., 'blog', 'email')
 * @returns {Promise<boolean>} Success status
 */
async function trackPurchase(purchase) {
  try {
    console.log(`Tracking purchase: ${JSON.stringify(purchase)}`);
    
    // Log purchase to file
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...purchase,
    };
    
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'purchases.json');
    let purchases = [];
    
    if (fs.existsSync(logFile)) {
      const data = fs.readFileSync(logFile, 'utf8');
      purchases = JSON.parse(data);
    }
    
    purchases.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(purchases, null, 2));
    
    return true;
  } catch (error) {
    console.error(`Error tracking purchase: ${error.message}`);
    return false;
  }
}

/**
 * Generate payment links for all products
 * @returns {Promise<Object>} Map of product names to payment links
 */
async function generateAllPaymentLinks() {
  try {
    const products = [
      'starter kit',
      'pro system',
      'agency license',
      'inner circle',
    ];
    
    const links = {};
    for (const product of products) {
      links[product] = await getPaymentLinkByProductName(product);
    }
    
    return links;
  } catch (error) {
    console.error(`Error generating all payment links: ${error.message}`);
    return {};
  }
}

/**
 * Insert payment link into content
 * @param {string} content - HTML content
 * @param {string} productName - Product name to link
 * @returns {Promise<string>} Updated content with payment link
 */
async function insertPaymentLink(content, productName) {
  try {
    const paymentLink = await getPaymentLinkByProductName(productName);
    if (!paymentLink) {
      return content;
    }
    
    // Replace product name with linked version
    const regex = new RegExp(`(${productName})`, 'gi');
    return content.replace(regex, `<a href="${paymentLink}" class="product-link">$1</a>`);
  } catch (error) {
    console.error(`Error inserting payment link: ${error.message}`);
    return content;
  }
}

module.exports = {
  createPaymentLink,
  getPaymentLinkByProductName,
  trackPurchase,
  generateAllPaymentLinks,
  insertPaymentLink,
};

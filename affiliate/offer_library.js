/**
 * Offer Library Module for WealthAutomationHQ
 * 
 * This module handles matching content to relevant affiliate offers
 * from the affiliate_offers.json library.
 */

const fs = require('fs');
const path = require('path');

// Path to affiliate offers JSON file
const OFFERS_FILE = path.join(__dirname, 'affiliate_offers.json');

// Cache for offers data
let offersCache = null;

/**
 * Load offers from JSON file
 * @returns {Promise<Array>} Array of offer objects
 */
async function loadOffers() {
  try {
    if (offersCache) {
      return offersCache;
    }
    
    console.log(`Loading offers from ${OFFERS_FILE}`);
    
    const data = fs.readFileSync(OFFERS_FILE, 'utf8');
    const offersData = JSON.parse(data);
    
    if (!offersData.offers || !Array.isArray(offersData.offers)) {
      throw new Error('Invalid offers data format');
    }
    
    console.log(`Loaded ${offersData.offers.length} offers`);
    offersCache = offersData.offers;
    
    return offersCache;
  } catch (error) {
    console.error(`Error loading offers: ${error.message}`);
    // Return empty array as fallback
    return [];
  }
}

/**
 * Get a matching offer based on content topics
 * @param {Array|string} topics - Content topics or keywords
 * @returns {Promise<Object|null>} Matching offer or null if none found
 */
async function getMatchingOffer(topics) {
  try {
    // Normalize topics to array
    const topicsArray = Array.isArray(topics) ? topics : [topics];
    
    console.log(`Finding offers matching topics: ${topicsArray.join(', ')}`);
    
    // Load offers
    const offers = await loadOffers();
    if (offers.length === 0) {
      console.log('No offers available');
      return null;
    }
    
    // Calculate relevance score for each offer
    const scoredOffers = offers.map(offer => {
      let score = 0;
      
      // Check category matches
      topicsArray.forEach(topic => {
        offer.categories.forEach(category => {
          if (category.toLowerCase().includes(topic.toLowerCase()) || 
              topic.toLowerCase().includes(category.toLowerCase())) {
            score += 3;
          }
        });
      });
      
      // Check keyword matches
      topicsArray.forEach(topic => {
        offer.keywords.forEach(keyword => {
          if (keyword.toLowerCase().includes(topic.toLowerCase()) || 
              topic.toLowerCase().includes(keyword.toLowerCase())) {
            score += 2;
          }
        });
      });
      
      // Add priority score
      score += offer.priority;
      
      return { offer, score };
    });
    
    // Sort by score (descending)
    scoredOffers.sort((a, b) => b.score - a.score);
    
    // Get top match if score is above threshold
    if (scoredOffers.length > 0 && scoredOffers[0].score > 0) {
      console.log(`Selected offer: ${scoredOffers[0].offer.name} (score: ${scoredOffers[0].score})`);
      return scoredOffers[0].offer;
    }
    
    // Fallback to random high-priority offer
    const highPriorityOffers = offers.filter(offer => offer.priority >= 3);
    if (highPriorityOffers.length > 0) {
      const randomOffer = highPriorityOffers[Math.floor(Math.random() * highPriorityOffers.length)];
      console.log(`Selected fallback offer: ${randomOffer.name}`);
      return randomOffer;
    }
    
    // Last resort: any random offer
    const randomOffer = offers[Math.floor(Math.random() * offers.length)];
    console.log(`Selected random offer: ${randomOffer.name}`);
    return randomOffer;
  } catch (error) {
    console.error(`Error getting matching offer: ${error.message}`);
    return null;
  }
}

/**
 * Get all available offers
 * @returns {Promise<Array>} Array of all offers
 */
async function getAllOffers() {
  return await loadOffers();
}

/**
 * Get offer by ID
 * @param {string} id - Offer ID
 * @returns {Promise<Object|null>} Offer object or null if not found
 */
async function getOfferById(id) {
  try {
    const offers = await loadOffers();
    return offers.find(offer => offer.id === id) || null;
  } catch (error) {
    console.error(`Error getting offer by ID: ${error.message}`);
    return null;
  }
}

/**
 * Reload offers from disk (clear cache)
 * @returns {Promise<boolean>} Success status
 */
async function reloadOffers() {
  try {
    offersCache = null;
    await loadOffers();
    return true;
  } catch (error) {
    console.error(`Error reloading offers: ${error.message}`);
    return false;
  }
}

module.exports = {
  getMatchingOffer,
  getAllOffers,
  getOfferById,
  reloadOffers
};

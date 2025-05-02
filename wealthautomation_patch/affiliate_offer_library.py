import os
import json
import random
import datetime
from pathlib import Path
from dotenv import load_dotenv
import re

class AffiliateOfferLibrary:
    """Manages affiliate offers and injects them into content."""

    def __init__(self, offers_file="/home/ubuntu/affiliate_offers.json"):
        """Initialize with offers from a JSON file."""
        load_dotenv("/home/ubuntu/updated_credentials.env")
        self.offers_file = offers_file
        # Define log files FIRST
        self.log_file = "/home/ubuntu/drop_reports/affiliate_offer_library.log"
        self.usage_log_file = "/home/ubuntu/drop_reports/offer_usage_log.csv"
        # Now call methods that might log
        self.offers = self._load_offers()
        self._ensure_usage_log_exists()
        # Log initialization only if log file setup was successful
        if Path(self.log_file).parent.exists():
             self._log("AffiliateOfferLibrary initialized")
        else:
             print(f"Warning: Log directory for {self.log_file} not found. Initialization log skipped.")

    def _log(self, message, level="INFO"):
        """Log messages to a file."""
        # Check if log_file attribute exists before trying to use it
        if not hasattr(self, 'log_file') or not Path(self.log_file).parent.exists():
            print(f"[{level}] {message} (Logging disabled: log file path not configured or directory missing)")
            return
            
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] [{level}] {message}\n"
        try:
            with open(self.log_file, "a") as f:
                f.write(log_message)
        except Exception as e:
             print(f"Error writing to log file {self.log_file}: {e}")
             
        if level == "ERROR" or level == "WARNING":
            print(log_message.strip())

    def _load_offers(self):
        """Load offers from the JSON file."""
        try:
            with open(self.offers_file, "r") as f:
                data = json.load(f)
                # Check if the loaded data is a dictionary and contains the 'offers' key
                if not isinstance(data, dict) or "offers" not in data:
                    self._log(f"Offers file {self.offers_file} does not contain a dictionary with an 'offers' key.", "ERROR")
                    return []
                
                offers_data = data["offers"] # Access the list under the 'offers' key
                
                # Ensure the 'offers' value is a list
                if not isinstance(offers_data, list):
                    self._log(f"The 'offers' key in {self.offers_file} does not contain a list.", "ERROR")
                    return []
                
                valid_offers = []
                for i, offer in enumerate(offers_data):
                    if isinstance(offer, dict):
                        valid_offers.append(offer)
                    else:
                        self._log(f"Item at index {i} in the 'offers' list is not a dictionary, skipping.", "WARNING")
                
                self._log(f"Loaded {len(valid_offers)} valid offers from {self.offers_file}")
                return valid_offers
        except FileNotFoundError:
            self._log(f"Offers file not found: {self.offers_file}", "ERROR")
            return []
        except json.JSONDecodeError as e:
            self._log(f"Error decoding JSON from {self.offers_file}: {e}", "ERROR")
            return []
        except Exception as e:
            self._log(f"Error loading offers: {e}", "ERROR")
            return []

    def _ensure_usage_log_exists(self):
        """Create the usage log CSV file with headers if it doesn"t exist."""
        # Check if usage_log_file attribute exists before trying to use it
        if not hasattr(self, 'usage_log_file') or not Path(self.usage_log_file).parent.exists():
            print(f"Warning: Usage log directory for {getattr(self, 'usage_log_file', 'N/A')} not found. Log creation skipped.")
            return
            
        if not Path(self.usage_log_file).exists():
            try:
                with open(self.usage_log_file, "w") as f:
                    f.write("Timestamp,OfferID,OfferName,ContentType,ContentTitle\n")
                self._log(f"Created offer usage log file: {self.usage_log_file}")
            except Exception as e:
                self._log(f"Error creating usage log file: {e}", "ERROR")

    def get_all_categories(self):
        """Return a list of unique categories from the offers."""
        categories = set()
        if not self.offers:
             return []
        for offer in self.offers:
            # Add type check before accessing
            if isinstance(offer, dict):
                categories.update(offer.get("categories", []))
            else:
                self._log(f"Skipping non-dictionary item during category gathering: {offer}", "WARNING")
        return list(categories)

    def _score_offer(self, offer, content, title):
        """Calculate a relevance score for an offer based on content and title."""
        # Ensure offer is a dictionary before proceeding
        if not isinstance(offer, dict):
            self._log(f"Attempted to score non-dictionary item: {offer}", "WARNING")
            return 0 # Return a neutral score
            
        score = 0
        keywords = offer.get("keywords", [])
        categories = offer.get("categories", [])
        priority = offer.get("priority", 1)
        
        # Ensure keywords and categories are lists
        if not isinstance(keywords, list):
            keywords = []
        if not isinstance(categories, list):
            categories = []
            
        # Normalize content and title for matching
        content_lower = content.lower()
        title_lower = title.lower()

        # Keyword matching in content
        for keyword in keywords:
            if isinstance(keyword, str) and keyword.lower() in content_lower:
                score += 2
        
        # Keyword matching in title (higher weight)
        for keyword in keywords:
             if isinstance(keyword, str) and keyword.lower() in title_lower:
                score += 5

        # Category matching (simple check if category name appears)
        for category in categories:
            if isinstance(category, str) and category.lower() in content_lower:
                score += 1
            if isinstance(category, str) and category.lower() in title_lower:
                score += 3
                
        # Add priority score (ensure it's numeric)
        if isinstance(priority, (int, float)):
            score += priority
        
        return score

    def match_content_to_offer(self, content, title):
        """Match content and title to the most relevant offer."""
        if not self.offers:
            self._log("No offers loaded, cannot match content.", "WARNING")
            return None
            
        best_offer = None
        highest_score = -1

        for offer in self.offers:
            # Skip if the item is not a dictionary
            if not isinstance(offer, dict):
                self._log(f"Skipping non-dictionary item during matching: {offer}", "WARNING")
                continue
                
            score = self._score_offer(offer, content, title)
            current_priority = offer.get("priority", 1)
            best_priority = best_offer.get("priority", 1) if isinstance(best_offer, dict) else 1
            
            if score > highest_score:
                highest_score = score
                best_offer = offer
            # Simple tie-breaking: prefer higher priority
            elif score == highest_score and isinstance(current_priority, (int, float)) and isinstance(best_priority, (int, float)) and current_priority > best_priority:
                 best_offer = offer

        if isinstance(best_offer, dict) and highest_score > 0: # Require some relevance and ensure best_offer is a dict
            offer_name = best_offer.get("name", "Unnamed Offer")
            self._log(f"Matched content to offer: {offer_name} with score {highest_score}")
        else:
            # Fallback: return a random offer if no match found or score is 0
            if not self.offers: # Check again in case offers failed to load initially
                 self._log("No offers available for fallback.", "ERROR")
                 return None
            # Ensure we pick a dictionary from the list for fallback
            valid_offers_for_fallback = [o for o in self.offers if isinstance(o, dict)]
            if not valid_offers_for_fallback:
                self._log("No valid dictionary offers available for fallback.", "ERROR")
                return None
                
            best_offer = random.choice(valid_offers_for_fallback)
            fallback_offer_name = best_offer.get("name", "Unnamed Fallback Offer")
            self._log(f"No relevant offer found (score <= 0), falling back to random offer: {fallback_offer_name}", "WARNING")
            
        # Final check to ensure we are returning a dictionary
        if isinstance(best_offer, dict):
            return best_offer
        else:
            self._log(f"Match content resulted in non-dictionary: {best_offer}", "ERROR")
            return None

    def generate_cta_html(self, offer):
        """Generate a CTA HTML block from the offer"s templates."""
        # Ensure offer is a dictionary
        if not isinstance(offer, dict):
            self._log(f"Cannot generate CTA for non-dictionary item: {offer}", "WARNING")
            return ""
            
        cta_templates = offer.get("ctaTemplates")
        if not cta_templates or not isinstance(cta_templates, list) or not cta_templates:
            self._log(f"Offer '{offer.get('name', 'N/A')}' has no valid CTA templates.", "WARNING")
            return ""
            
        # Filter out non-string templates
        valid_templates = [t for t in cta_templates if isinstance(t, str)]
        if not valid_templates:
             self._log(f"Offer '{offer.get('name', 'N/A')}' has no valid string CTA templates.", "WARNING")
             return ""
             
        template = random.choice(valid_templates)
        offer_url = offer.get("url", "#")
        if not isinstance(offer_url, str):
            offer_url = "#"
            
        # Basic UTM parameter addition (can be expanded)
        utm_source = "wealthautomation"
        utm_medium = "blog" # Or "email"
        utm_campaign = offer.get("id", "offer")
        
        # Append UTM parameters carefully
        separator = "&" if "?" in offer_url else "?"
        tracked_url = f"{offer_url}{separator}utm_source={utm_source}&utm_medium={utm_medium}&utm_campaign={utm_campaign}"
        
        cta_html = template.replace("{{url}}", tracked_url)
        return cta_html

    def inject_cta_into_content(self, content, offer, position="end"):
        """Inject the generated CTA HTML into the content."""
        # Ensure offer is a dictionary
        if not isinstance(offer, dict):
             self._log(f"Cannot inject CTA for non-dictionary item: {offer}", "WARNING")
             return content
             
        cta_html = self.generate_cta_html(offer)
        if not cta_html:
            return content

        # Wrap CTA in a consistent div for styling/identification
        cta_wrapper = f"<div class=\"wealthautomation-cta\">{cta_html}</div>"

        if position == "end":
            return f"{content}\n\n{cta_wrapper}"
        elif position == "middle":
            # Find a suitable injection point (e.g., after a paragraph)
            # Use regex to handle potential variations in <p> tags
            paragraphs = re.split(r"(</p>\s*)", content, flags=re.IGNORECASE)
            if len(paragraphs) > 3: # Need at least two paragraphs to inject between
                # Find the middle paragraph index (adjusting for split results)
                middle_index = (len(paragraphs) // 2) 
                if middle_index % 2 == 0: # Ensure we insert after a </p>
                    middle_index -= 1
                
                paragraphs.insert(middle_index + 1, cta_wrapper)
                return "".join(paragraphs)
            else:
                # Fallback to end if content is too short or not structured with <p>
                self._log("Content too short or not structured with <p> tags for middle injection, falling back to end.", "WARNING")
                return f"{content}\n\n{cta_wrapper}"
        elif position == "start":
             return f"{cta_wrapper}\n\n{content}"
        else: # Default to end
             return f"{content}\n\n{cta_wrapper}"

    def log_offer_usage(self, offer, content_title, content_type="blog"):
        """Log the usage of an offer to a CSV file."""
        # Ensure offer is a dictionary
        if not isinstance(offer, dict):
            self._log(f"Cannot log usage for non-dictionary item: {offer}", "WARNING")
            return
            
        timestamp = datetime.datetime.now().isoformat()
        offer_id = offer.get("id", "N/A")
        offer_name = offer.get("name", "N/A")
        # Sanitize title for CSV
        safe_title = content_title.replace('"', '').replace(',', ';')
        
        # Escape internal quotes and wrap fields in quotes
        escaped_offer_name = str(offer_name).replace('"', '""') # Ensure name is string
        quoted_offer_name = f'"{escaped_offer_name}"'
        escaped_safe_title = safe_title.replace('"', '""')
        quoted_safe_title = f'"{escaped_safe_title}"'
        log_entry = f'{timestamp},{offer_id},{quoted_offer_name},{content_type},{quoted_safe_title}\n'
        
        try:
            # Check if usage_log_file attribute exists before trying to use it
            if not hasattr(self, 'usage_log_file') or not Path(self.usage_log_file).parent.exists():
                 print(f"Warning: Usage log directory for {getattr(self, 'usage_log_file', 'N/A')} not found. Usage log skipped.")
                 return
                 
            with open(self.usage_log_file, "a") as f:
                f.write(log_entry)
            self._log(f"Logged usage for offer: {offer_name}")
        except Exception as e:
            self._log(f"Error logging offer usage: {e}", "ERROR")

# Example usage (for testing)
if __name__ == "__main__":
    # Create a dummy offers file if it doesn't exist
    dummy_offers_file = "/home/ubuntu/affiliate_offers.json"
    # Always recreate for testing the load logic
    # Use triple single quotes for HTML templates to avoid escaping issues
    dummy_data_dict = {
        "offers": [
            {
                "id": "ck_offer",
                "name": "ConvertKit Trial",
                "description": "Start your free ConvertKit trial.",
                "url": "https://convertkit.com/?lmref=example",
                "commission": "30% recurring",
                "categories": ["Email Marketing", "Automation"],
                "keywords": ["email list", "newsletter", "automation", "convertkit"],
                "priority": 5,
                "ctaTemplates": [
                    '''<p><strong>Ready to grow your email list?</strong> <a href="{{url}}">Start your free ConvertKit trial today!</a></p>''',
                    '''<div style="border: 1px solid #ccc; padding: 15px; margin: 15px 0;"><p>Build your audience with the email marketing platform designed for creators. <a href="{{url}}">Try ConvertKit free!</a></p></div>'''
                ]
            },
            {
                "id": "ai_tool_offer",
                "name": "AI Writing Assistant",
                "description": "Generate content faster with AI.",
                "url": "https://aiwritingtool.com/partner=example",
                "commission": "20% one-time",
                "categories": ["AI Tools", "Content Creation"],
                "keywords": ["artificial intelligence", "writing", "copywriting", "ai tool"],
                "priority": 3,
                "ctaTemplates": [
                    # Using triple quotes to handle the apostrophe correctly
                    '''<p><em>Struggling with writer\'s block?</em> <a href="{{url}}">Let this AI Writing Assistant help you create content 10x faster!</a></p>'''
                ]
            },
            "This is not a dictionary and should be skipped"
        ]
    }
    try:
        with open(dummy_offers_file, "w") as f:
            json.dump(dummy_data_dict, f, indent=2)
        print(f"Created/Updated dummy offers file: {dummy_offers_file}")
    except Exception as e:
         print(f"Error creating dummy offers file: {e}")

    offer_lib = AffiliateOfferLibrary(offers_file=dummy_offers_file)
    
    print("\n--- Testing Get Categories ---")
    categories = offer_lib.get_all_categories()
    print(f"Found categories: {categories}")

    print("\n--- Testing Match Content ---")
    test_content = "This post discusses the importance of building an email list using tools like ConvertKit."
    test_title = "Email Marketing Essentials"
    matched = offer_lib.match_content_to_offer(test_content, test_title)
    if matched:
        offer_name = matched.get("name", "Unnamed Offer") # Use .get for safety
        print(f"Matched offer: {offer_name}")
    else:
        print("No offer matched.")

    print("\n--- Testing Generate CTA ---")
    if matched:
        cta = offer_lib.generate_cta_html(matched)
        print(f"Generated CTA:\n{cta}")
    
    print("\n--- Testing Inject CTA (Middle) ---")
    if matched:
        content_with_cta = offer_lib.inject_cta_into_content("<p>Paragraph 1.</p><p>Paragraph 2.</p><p>Paragraph 3.</p>", matched, position="middle")
        print(f"Content with CTA:\n{content_with_cta}")

    print("\n--- Testing Log Usage ---")
    if matched:
        offer_lib.log_offer_usage(matched, test_title, content_type="test")
        offer_name = matched.get("name", "Unnamed Offer") # Use .get for safety
        print(f"Usage logged for offer: {offer_name}")



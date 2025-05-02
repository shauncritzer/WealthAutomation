import os
import requests
import json
import base64
import datetime
from pathlib import Path
from dotenv import load_dotenv

# Define a standard browser User-Agent
BROWSER_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"

class JWTWordPressIntegration:
    """Handles WordPress integration using JWT authentication."""

    def __init__(self):
        """Initialize with credentials from environment variables."""
        load_dotenv() # Load .env file in the current directory if it exists (for local testing)
        self.wp_user = os.getenv("WORDPRESS_USER")
        self.wp_endpoint = os.getenv("WORDPRESS_API_URL", "https://wealthautomationhq.com/wp-json/wp/v2/posts") # Use WORDPRESS_API_URL
        self.jwt_secret = os.getenv("WORDPRESS_JWT_SECRET")
        self.jwt_token = None
        # Use relative paths for Railway compatibility
        self.log_dir = Path("drop_reports")
        self.fallback_dir = self.log_dir / "wp_fallback"
        self.log_file = self.log_dir / "jwt_wordpress_integration.log"
        # Ensure directories exist
        self._ensure_dirs_exist()
        self._log("JWTWordPressIntegration initialized")
        self._get_jwt_token()

    def _ensure_dirs_exist(self):
        """Create log and fallback directories if they don't exist."""
        try:
            self.log_dir.mkdir(parents=True, exist_ok=True)
            self.fallback_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            print(f"Error creating directories {self.log_dir} or {self.fallback_dir}: {e}")

    def _log(self, message, level="INFO"):
        """Log messages to a file."""
        if not self.log_dir.exists():
            print(f"[{level}] {message} (Logging disabled: log directory {self.log_dir} missing)")
            return
            
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] [{level}] {message}\n"
        try:
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_message)
        except Exception as e:
             print(f"Error writing to log file {self.log_file}: {e}")
             
        # Also print ERROR/WARNING to console/Railway logs for visibility
        if level == "ERROR" or level == "WARNING":
            print(log_message.strip())

    def _get_jwt_token(self):
        """Obtain JWT token from WordPress with enhanced logging and JSON decode error handling."""
        if not self.wp_user or not self.jwt_secret:
            self._log("Missing WORDPRESS_USER or WORDPRESS_JWT_SECRET in environment variables", "ERROR")
            return False

        base_api_url = os.getenv("WORDPRESS_API_URL", "").replace("/wp/v2/posts", "")
        if not base_api_url:
             self._log("Missing WORDPRESS_API_URL in environment variables", "ERROR")
             return False
        token_endpoint = f"{base_api_url}/jwt-auth/v1/token"
        
        wp_app_password = os.getenv("WORDPRESS_APP_PASSWORD")
        if not wp_app_password:
             self._log("Missing WORDPRESS_APP_PASSWORD for token generation", "ERROR")
             return False
             
        headers = {
            "Content-Type": "application/json",
            "User-Agent": BROWSER_USER_AGENT 
        }
        data = {
            "username": self.wp_user,
            "password": wp_app_password.replace(" ", "") # Ensure no spaces
        }
        
        # Enhanced logging for the request
        self._log(f"--- JWT Token Request --- START ---")
        self._log(f"Request URL: POST {token_endpoint}")
        self._log(f"Request Headers: {json.dumps(headers, indent=2)}")
        self._log(f"Request Body Keys: {list(data.keys())}") 
        self._log(f"--- JWT Token Request --- SENDING ---")
        
        response = None # Initialize response variable
        try:
            response = requests.post(token_endpoint, headers=headers, json=data, timeout=30)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
            
            # Attempt to decode JSON, with specific handling for decode errors
            try:
                token_data = response.json()
                if "token" in token_data:
                    self.jwt_token = token_data["token"]
                    self._log("Successfully obtained JWT token")
                    self._log(f"--- JWT Token Request --- SUCCESS ---")
                    return True
                else:
                    self._log(f"Failed to obtain JWT token. Response JSON: {token_data}", "ERROR")
                    self._log(f"--- JWT Token Request --- FAILED (No Token in JSON) ---")
                    # Log response details even if token is missing but JSON is valid
                    self._log(f"--- JWT Token Response (No Token) --- START ---")
                    self._log(f"Response Status Code: {response.status_code}", "ERROR")
                    self._log(f"Response Headers: {json.dumps(dict(response.headers), indent=2)}", "ERROR")
                    self._log(f"Response Body: {response.text}", "ERROR")
                    self._log(f"--- JWT Token Response (No Token) --- END ---")
                    return False
            except requests.exceptions.JSONDecodeError as json_err:
                # This is the specific error we were seeing ('Expecting value...')
                self._log(f"Error obtaining JWT token: JSONDecodeError - {json_err}", "ERROR")
                self._log(f"--- JWT Token Response (JSON Decode Error) --- START ---")
                self._log(f"Response Status Code: {response.status_code}", "ERROR")
                self._log(f"Response Headers: {json.dumps(dict(response.headers), indent=2)}", "ERROR")
                # Log the raw response text which caused the JSON error
                self._log(f"Response Body (RAW): {response.text}", "ERROR") 
                self._log(f"--- JWT Token Response (JSON Decode Error) --- END ---")
                return False
                
        except requests.exceptions.RequestException as e:
            # Handle other request exceptions (connection errors, timeouts, HTTP errors)
            self._log(f"Error obtaining JWT token: {e}", "ERROR")
            if response is not None: # Check if response object exists
                 self._log(f"--- JWT Token Response (Request Error) --- START ---")
                 self._log(f"Response Status Code: {response.status_code}", "ERROR")
                 self._log(f"Response Headers: {json.dumps(dict(response.headers), indent=2)}", "ERROR")
                 self._log(f"Response Body: {response.text}", "ERROR")
                 self._log(f"--- JWT Token Response (Request Error) --- END ---")
            else:
                 self._log(f"--- JWT Token Request --- FAILED (No Response Object) ---")
            return False

    def _get_auth_header(self):
        """Return the authorization header for API requests, including User-Agent."""
        if not self.jwt_token:
            self._log("JWT token not available, attempting to refresh", "WARNING")
            if not self._get_jwt_token():
                self._log("Failed to refresh JWT token", "ERROR")
                return None
        return {
            "Authorization": f"Bearer {self.jwt_token}",
            "User-Agent": BROWSER_USER_AGENT
        }

    def get_posts(self, per_page=10):
        """Retrieve recent posts from WordPress."""
        headers = self._get_auth_header()
        if not headers:
            return []
            
        params = {"per_page": per_page, "orderby": "date", "order": "desc"}
        self._log(f"Attempting to get posts from {self.wp_endpoint}")
        try:
            response = requests.get(self.wp_endpoint, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            posts = response.json()
            self._log(f"Successfully retrieved {len(posts)} posts")
            return posts
        except requests.exceptions.RequestException as e:
            self._log(f"Error getting posts: {e}", "ERROR")
            if hasattr(e, 'response') and e.response is not None:
                 self._log(f"Response status: {e.response.status_code}", "ERROR")
                 self._log(f"Response text: {e.response.text}", "ERROR")
            return []
        except requests.exceptions.JSONDecodeError as json_err:
             self._log(f"Error decoding JSON response for get_posts: {json_err}", "ERROR")
             if 'response' in locals() and response is not None:
                 self._log(f"Raw response text: {response.text}", "ERROR")
             return []

    def create_post(self, title, content, status="publish"):
        """Create a new post in WordPress."""
        headers = self._get_auth_header()
        if not headers:
            return None, None, self._save_fallback(title, content)
            
        headers["Content-Type"] = "application/json" # Ensure Content-Type is set
        data = {
            "title": title,
            "content": content,
            "status": status
        }
        self._log(f"Attempting to create post: 	'{title[:60]}...	'") # Log truncated title
        response = None # Initialize response
        try:
            response = requests.post(self.wp_endpoint, headers=headers, json=data, timeout=60)
            response.raise_for_status()
            
            try:
                post_data = response.json()
                post_id = post_data.get("id")
                post_url = post_data.get("link")
                if post_id and post_url:
                    self._log(f"Successfully created post with ID: {post_id}, URL: {post_url}")
                    return post_id, post_url, None
                else:
                    self._log(f"Post created but response missing ID/URL. Response: {post_data}", "WARNING")
                    return None, None, self._save_fallback(title, content)
            except requests.exceptions.JSONDecodeError as json_err:
                self._log(f"Error decoding JSON response for create_post: {json_err}", "ERROR")
                self._log(f"Raw response text: {response.text}", "ERROR")
                return None, None, self._save_fallback(title, content)
                
        except requests.exceptions.RequestException as e:
            self._log(f"Error creating post: {e}", "ERROR")
            if response is not None:
                 self._log(f"Response status: {response.status_code}", "ERROR")
                 response_text = response.text[:500] + (	'...	' if len(response.text) > 500 else 	'	')
                 self._log(f"Response text: {response_text}", "ERROR")
            fallback_file = self._save_fallback(title, content)
            return None, None, fallback_file

    def _save_fallback(self, title, content):
        """Save post content locally if API call fails."""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = "".join(c if c.isalnum() else "_" for c in title)[:50]
        fallback_filename = self.fallback_dir / f"wp_fallback_{timestamp}_{safe_title}.html"
        try:
            fallback_filename.parent.mkdir(parents=True, exist_ok=True)
            with open(fallback_filename, "w", encoding="utf-8") as f:
                f.write(f"<h1>{title}</h1>\n{content}")
            self._log(f"Saved fallback content to {fallback_filename}", "WARNING")
            return str(fallback_filename) # Return as string path
        except Exception as e:
            self._log(f"Error saving fallback file: {e}", "ERROR")
            return None

# Example usage (for testing)
if __name__ == "__main__":
    wp_integration = JWTWordPressIntegration()
    if wp_integration.jwt_token:
        print("\n--- Testing Get Posts ---")
        posts = wp_integration.get_posts(per_page=2)
        if posts:
            print(f"Retrieved {len(posts)} posts.")
            for post in posts:
                post_id_val = post["id"]
                post_title = post["title"]["rendered"]
                print(f"  - ID: {post_id_val}, Title: {post_title}")
        else:
            print("Failed to retrieve posts.")
            
        print("\n--- Testing Create Post ---")
        test_title_timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        test_title = f"JWT Integration Test Post (Improved Log) - {test_title_timestamp}"
        test_content = "<p>This is a test post created via JWT authentication with improved logging for JSON decode errors.</p>"
        post_id, post_url, fallback_file = wp_integration.create_post(test_title, test_content)
        if post_id:
            print(f"Successfully created post: {post_url}")
        else:
            print(f"Failed to create post. Fallback saved to: {fallback_file}")
    else:
        print("Failed to initialize JWT WordPress Integration (could not get token).")


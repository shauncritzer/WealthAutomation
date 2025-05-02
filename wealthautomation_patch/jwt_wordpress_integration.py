import os
import requests
import json
import base64
import datetime
from pathlib import Path
from dotenv import load_dotenv

class JWTWordPressIntegration:
    """Handles WordPress integration using JWT authentication."""

    def __init__(self):
        """Initialize with credentials from environment variables."""
        load_dotenv("/home/ubuntu/updated_credentials.env")
        self.wp_user = os.getenv("WORDPRESS_USER")
        self.wp_endpoint = os.getenv("WORDPRESS_ENDPOINT", "https://wealthautomationhq.com/wp-json/wp/v2/posts")
        self.jwt_secret = os.getenv("WORDPRESS_JWT_SECRET")
        self.jwt_token = None
        self.fallback_dir = "/home/ubuntu/drop_reports/wp_fallback"
        Path(self.fallback_dir).mkdir(parents=True, exist_ok=True)
        self.log_file = "/home/ubuntu/drop_reports/jwt_wordpress_integration.log"
        self._log("JWTWordPressIntegration initialized")
        self._get_jwt_token()

    def _log(self, message, level="INFO"):
        """Log messages to a file."""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] [{level}] {message}\n"
        with open(self.log_file, "a") as f:
            f.write(log_message)
        # Also print errors for immediate visibility
        if level == "ERROR" or level == "WARNING":
            print(log_message.strip())

    def _get_jwt_token(self):
        """Obtain JWT token from WordPress."""
        if not self.wp_user or not self.jwt_secret:
            self._log("Missing WordPress user or JWT secret in environment variables", "ERROR")
            return False

        token_endpoint = "https://wealthautomationhq.com/wp-json/jwt-auth/v1/token"
        # Note: WP Engine might require specific user/pass for token generation, 
        # using the Application Password here as a placeholder based on previous attempts.
        # If this fails, the user might need a standard WP password.
        wp_app_password = os.getenv("WORDPRESS_APP_PASSWORD")
        if not wp_app_password:
             self._log("Missing WordPress application password for token generation", "ERROR")
             return False
             
        headers = {"Content-Type": "application/json"}
        data = {
            "username": self.wp_user,
            "password": wp_app_password.replace(" ", "") # Ensure no spaces
        }
        
        self._log(f"Attempting to get JWT token from {token_endpoint} for user {self.wp_user}")
        try:
            response = requests.post(token_endpoint, headers=headers, json=data, timeout=30)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
            
            token_data = response.json()
            if "token" in token_data:
                self.jwt_token = token_data["token"]
                self._log("Successfully obtained JWT token")
                return True
            else:
                self._log(f"Failed to obtain JWT token. Response: {token_data}", "ERROR")
                return False
        except requests.exceptions.RequestException as e:
            self._log(f"Error obtaining JWT token: {e}", "ERROR")
            if hasattr(e, 'response') and e.response is not None:
                 self._log(f"Response status: {e.response.status_code}", "ERROR")
                 self._log(f"Response text: {e.response.text}", "ERROR")
            return False

    def _get_auth_header(self):
        """Return the authorization header for API requests."""
        if not self.jwt_token:
            self._log("JWT token not available, attempting to refresh", "WARNING")
            if not self._get_jwt_token():
                self._log("Failed to refresh JWT token", "ERROR")
                return None
        return {"Authorization": f"Bearer {self.jwt_token}"}

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

    def create_post(self, title, content, status="publish"):
        """Create a new post in WordPress."""
        headers = self._get_auth_header()
        if not headers:
            return None, None, self._save_fallback(title, content)
            
        headers["Content-Type"] = "application/json"
        data = {
            "title": title,
            "content": content,
            "status": status
        }
        self._log(f"Attempting to create post: ", "INFO")
        try:
            response = requests.post(self.wp_endpoint, headers=headers, json=data, timeout=60)
            response.raise_for_status()
            post_data = response.json()
            post_id = post_data.get("id")
            post_url = post_data.get("link")
            self._log(f"Successfully created post with ID: {post_id}, URL: {post_url}")
            return post_id, post_url, None
        except requests.exceptions.RequestException as e:
            self._log(f"Error creating post: {e}", "ERROR")
            if hasattr(e, 'response') and e.response is not None:
                 self._log(f"Response status: {e.response.status_code}", "ERROR")
                 self._log(f"Response text: {e.response.text}", "ERROR")
            fallback_file = self._save_fallback(title, content)
            return None, None, fallback_file

    def _save_fallback(self, title, content):
        """Save post content locally if API call fails."""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = "".join(c if c.isalnum() else "_" for c in title)[:50]
        fallback_filename = f"{self.fallback_dir}/wp_fallback_{timestamp}_{safe_title}.html"
        try:
            with open(fallback_filename, "w") as f:
                f.write(f"<h1>{title}</h1>\n{content}")
            self._log(f"Saved fallback content to {fallback_filename}", "WARNING")
            return fallback_filename
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
        test_title = f"JWT Integration Test Post - {test_title_timestamp}"
        test_content = "<p>This is a test post created via JWT authentication.</p>"
        post_id, post_url, fallback_file = wp_integration.create_post(test_title, test_content)
        if post_id:
            print(f"Successfully created post: {post_url}")
        else:
            print(f"Failed to create post. Fallback saved to: {fallback_file}")
    else:
        print("Failed to initialize JWT WordPress Integration (could not get token).")


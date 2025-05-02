import os
import requests
import json
import datetime
from pathlib import Path
from dotenv import load_dotenv

class ConvertKitV4Integration:
    """Handles ConvertKit integration using the V4 API."""

    def __init__(self):
        """Initialize with credentials from environment variables."""
        load_dotenv("/home/ubuntu/updated_credentials.env")
        # Try using the V4 API KEY for authentication based on user update
        self.api_key_v4 = os.getenv("CONVERTKIT_API_KEY_V4") 
        self.base_url = "https://api.convertkit.com/v4"
        self.fallback_dir = "/home/ubuntu/drop_reports/ck_fallback"
        Path(self.fallback_dir).mkdir(parents=True, exist_ok=True)
        self.log_file = "/home/ubuntu/drop_reports/convertkit_v4_integration.log"
        self._log("ConvertKitV4Integration initialized")
        if not self.api_key_v4:
            # Log error if V4 key is missing, as we are now trying it for auth
            self._log("Missing CONVERTKIT_API_KEY_V4 in environment variables", "ERROR")

    def _log(self, message, level="INFO"):
        """Log messages to a file."""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] [{level}] {message}\n"
        with open(self.log_file, "a") as f:
            f.write(log_message)
        # Also print errors for immediate visibility
        if level == "ERROR" or level == "WARNING":
            print(log_message.strip())

    def _get_headers(self):
        """Return the authorization header for API requests."""
        if not self.api_key_v4:
            self._log("API Key V4 not available for headers", "ERROR")
            return None
        # V4 API might use the API Key V4 as the Bearer token
        return {
            "Authorization": f"Bearer {self.api_key_v4}", 
            "Content-Type": "application/json"
        }

    def get_forms(self):
        """Retrieve forms from ConvertKit."""
        headers = self._get_headers()
        if not headers:
            return []
            
        endpoint = f"{self.base_url}/forms"
        self._log(f"Attempting to get forms from {endpoint} using V4 Key")
        try:
            response = requests.get(endpoint, headers=headers, timeout=30)
            response.raise_for_status()
            forms_data = response.json()
            forms = forms_data.get("forms", [])
            self._log(f"Successfully retrieved {len(forms)} forms using V4 Key")
            return forms
        except requests.exceptions.RequestException as e:
            self._log(f"Error getting forms using V4 Key: {e}", "ERROR")
            if hasattr(e, 'response') and e.response is not None:
                 self._log(f"Response status: {e.response.status_code}", "ERROR")
                 self._log(f"Response text: {e.response.text}", "ERROR")
            return []

    def create_and_send_email_blast(self, subject, content):
        """Create and automatically send an email blast using V4 API."""
        headers = self._get_headers()
        if not headers:
            self._log("Cannot create blast, headers unavailable.", "ERROR")
            return None, self._save_fallback(subject, content), False
            
        endpoint = f"{self.base_url}/email_blasts"
        data = {
            "subject": subject,
            "content": content
            # V4 sends immediately upon creation, no separate send step
        }
        self._log(f"Attempting to create and send email blast using V4 Key: ", "INFO")
        try:
            response = requests.post(endpoint, headers=headers, json=data, timeout=60)
            response.raise_for_status()
            blast_data = response.json()
            email_blast_id = blast_data.get("email_blast", {}).get("id")
            
            if email_blast_id:
                self._log(f"Successfully created and sent email blast with ID: {email_blast_id} using V4 Key")
                # V4 sends automatically, so we assume sent=True if creation is successful
                return email_blast_id, None, True 
            else:
                self._log(f"Failed to create email blast using V4 Key. Response: {blast_data}", "ERROR")
                fallback_file = self._save_fallback(subject, content)
                return None, fallback_file, False
                
        except requests.exceptions.RequestException as e:
            self._log(f"Error creating/sending email blast using V4 Key: {e}", "ERROR")
            if hasattr(e, 'response') and e.response is not None:
                 self._log(f"Response status: {e.response.status_code}", "ERROR")
                 self._log(f"Response text: {e.response.text}", "ERROR")
            fallback_file = self._save_fallback(subject, content)
            return None, fallback_file, False

    def _save_fallback(self, subject, content):
        """Save email content locally if API call fails."""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_subject = "".join(c if c.isalnum() else "_" for c in subject)[:50]
        fallback_filename = f"{self.fallback_dir}/ck_fallback_{timestamp}_{safe_subject}.html"
        try:
            with open(fallback_filename, "w") as f:
                f.write(f"<h1>{subject}</h1>\n{content}")
            self._log(f"Saved fallback content to {fallback_filename}", "WARNING")
            return fallback_filename
        except Exception as e:
            self._log(f"Error saving fallback file: {e}", "ERROR")
            return None

# Example usage (for testing)
if __name__ == "__main__":
    ck_integration = ConvertKitV4Integration()
    if ck_integration.api_key_v4: # Check if V4 key is loaded
        print("\n--- Testing Get Forms (using V4 Key) ---")
        forms = ck_integration.get_forms()
        if forms:
            print(f"Retrieved {len(forms)} forms.")
            for form in forms:
                form_id_val = form["id"]
                form_name = form["name"]
                print(f"  - ID: {form_id_val}, Name: {form_name}")
        else:
            print("Failed to retrieve forms.")
            
        print("\n--- Testing Create and Send Email Blast (using V4 Key) ---")
        test_subject_timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        test_subject = f"V4 API Test Email (V4 Key Auth) - {test_subject_timestamp}"
        test_content = "<p>This is a test email sent via the ConvertKit V4 API using the API Key V4 for authentication.</p>"
        email_blast_id, fallback_file, sent = ck_integration.create_and_send_email_blast(test_subject, test_content)
        if email_blast_id and sent:
            print(f"Successfully created and sent email blast: ID {email_blast_id}")
        else:
            print(f"Failed to create/send email blast. Fallback saved to: {fallback_file}")
    else:
        print("Failed to initialize ConvertKit V4 Integration (missing API key V4).")


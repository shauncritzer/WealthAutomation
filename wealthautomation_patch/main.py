import os
import requests

def get_env(var, default=None):
    value = os.getenv(var)
    if not value:
        print(f"⚠️ Warning: Missing ENV var {var}")
        return default
    return value

OPENAI_API_KEY = get_env("OPENAI_API_KEY")
WORDPRESS_USER = get_env("WORDPRESS_USER")
WORDPRESS_APP_PASSWORD = get_env("WORDPRESS_APP_PASSWORD")
CONVERTKIT_API_KEY = get_env("CONVERTKIT_API_KEY")
CONVERTKIT_BASIC_TAG_ID = get_env("CONVERTKIT_BASIC_TAG_ID")
MAKE_WEBHOOK_URL = get_env("MAKE_WEBHOOK_URL")
GOOGLE_SHEETS_UTM_TRACKER_ID = get_env("GOOGLE_SHEETS_UTM_TRACKER_ID")
DISCORD_WEBHOOK_URL = get_env("DISCORD_WEBHOOK_URL")

# Simulated run for confirmation
if __name__ == "__main__":
    print("✅ ENV vars loaded.")
    print("Ready to trigger automation...")

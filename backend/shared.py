import os
import litellm
from dotenv import load_dotenv

load_dotenv()

# API keys from environment only — never hardcoded.
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")

# ponytail: default to Gemini free tier; OpenRouter is optional user override.
DEFAULT_MODEL = "gemini/gemini-2.5-flash"

litellm.api_base = "https://generativelanguage.googleapis.com/v1beta/openai/"

# Enable retry logic to handle rate limit (429) errors from free models
litellm.num_retries = 3

import os
import litellm
from dotenv import load_dotenv

load_dotenv()  # pull OPENROUTER_API_KEY from .env (gitignored)

# OpenRouter key from environment only — never hardcoded.
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY")

# OpenRouter Free Preset Routing
DEFAULT_MODEL = "litellm:openrouter/google/gemini-2.5-flash"

# litellm.api_key is set per-request in app.py (custom key or default),
# so no global assignment here.
litellm.api_base = "https://openrouter.ai/api/v1"

# Enable retry logic to handle rate limit (429) errors from free models
litellm.num_retries = 3

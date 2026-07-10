import os
import litellm

# OpenRouter key from environment only — never hardcoded.
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY")

<<<<<<< fix/thinking-isolation-model-routing
# OpenRouter Free Preset Routing
# In OpenRouter, "openrouter/free" routes to available free models automatically.
# We also use the preset/open-free routing instructions provided.
DEFAULT_MODEL = "litellm:openrouter/google/gemini-2.5-flash"
=======
DEFAULT_MODEL = "litellm:openrouter/tencent/hy3:free"
>>>>>>> local

# litellm.api_key is set per-request in app.py (custom key or default),
# so no global assignment here.
litellm.api_base = "https://openrouter.ai/api/v1"

# Enable retry logic to handle rate limit (429) errors from free models
litellm.num_retries = 3

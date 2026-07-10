import os
import litellm

# Configure OpenRouter model routing
OPENROUTER_KEY = os.environ.get(
    "OPENROUTER_API_KEY", 
    "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"
)

# OpenRouter Free Preset Routing
# In OpenRouter, "openrouter/free" routes to available free models automatically.
# We also use the preset/open-free routing instructions provided.
DEFAULT_MODEL = "litellm:openrouter/google/gemini-2.5-flash"

# Configure LiteLLM globally
litellm.api_key = OPENROUTER_KEY
litellm.api_base = "https://openrouter.ai/api/v1"

# Enable retry logic to handle rate limit (429) errors from free models
litellm.num_retries = 3

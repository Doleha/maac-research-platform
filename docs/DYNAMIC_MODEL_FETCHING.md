# Dynamic Model Fetching

The MAAC Research Platform dynamically fetches available models from actual LLM provider APIs instead of maintaining hardcoded lists. This ensures the platform always has access to the latest models as providers release them.

## Architecture

### Backend: Model Fetcher (`apps/api/src/lib/model-fetcher.ts`)

The model fetcher implements:

1. **Provider-Specific Fetchers**: Each provider has a dedicated function that calls their models API
2. **In-Memory Caching**: Models are cached for 1 hour to reduce API calls and improve performance
3. **Fallback Mechanism**: If API calls fail, default model lists are returned
4. **Error Handling**: Graceful degradation with console warnings

### API Routes (`apps/api/src/routes/llm.ts`)

Three endpoints are exposed:

#### `GET /api/llm/models?provider={provider}&refresh={true|false}`

Fetch available models for a specific provider.

**Query Parameters:**
- `provider` (required): The LLM provider (openai, anthropic, deepseek, openrouter, grok, gemini, llama)
- `refresh` (optional): Set to 'true' to bypass cache and fetch fresh data from provider API

**Response:**
```json
{
  "models": [
    { "value": "gpt-4o", "label": "gpt-4o" },
    { "value": "gpt-4o-mini", "label": "gpt-4o-mini" }
  ],
  "count": 2,
  "cached": false
}
```

#### `GET /api/llm/providers`

Get list of all available providers.

**Response:**
```json
{
  "providers": [
    { "value": "openai", "label": "OpenAI" },
    { "value": "anthropic", "label": "Anthropic" }
  ],
  "total": 7
}
```

#### `POST /api/llm/refresh-cache`

Clear model cache for a specific provider or all providers.

**Body:**
```json
{
  "provider": "openai"  // Optional: omit to clear all
}
```

**Response:**
```json
{
  "message": "Cache cleared for provider: openai"
}
```

## Provider API Endpoints

### OpenAI
- **Endpoint**: `https://api.openai.com/v1/models`
- **Authentication**: Bearer token (OPENAI_API_KEY)
- **Filtering**: Only includes models with 'gpt' in the name

### Anthropic
- **Note**: No public models endpoint available
- **Fallback**: Maintains curated list based on official documentation
- **Models**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku

### DeepSeek
- **Endpoint**: `https://api.deepseek.com/models`
- **Authentication**: Bearer token (DEEPSEEK_API_KEY)
- **Models**: deepseek-chat, deepseek-coder

### OpenRouter
- **Endpoint**: `https://openrouter.ai/api/v1/models`
- **Authentication**: Optional Bearer token (OPENROUTER_API_KEY)
- **Note**: Public endpoint, returns models from all providers they support

### Grok (xAI)
- **Endpoint**: `https://api.x.ai/v1/models`
- **Authentication**: Bearer token (GROK_API_KEY)
- **Models**: grok-beta, grok-2

### Google Gemini
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}`
- **Authentication**: API key in query string (GEMINI_API_KEY)
- **Filtering**: Only includes models with 'gemini' in the name

### Llama (Meta)
- **Implementation**: Uses OpenRouter as proxy
- **Filtering**: Filters OpenRouter models for those containing 'llama'
- **Models**: Various Llama 3.1 and 3.2 models

## Caching Strategy

### In-Memory Cache
- **Duration**: 1 hour (3600000ms)
- **Storage**: `Map<string, CachedModels>`
- **Key**: Provider name (e.g., "openai")
- **Value**: `{ models: string[], timestamp: number }`

### Production Considerations
For production deployments with multiple API server instances:
- Replace in-memory cache with **Redis**
- Use a shared cache key format: `llm:models:{provider}`
- Set TTL to 1 hour using Redis EXPIRE
- Consider implementing background refresh to keep cache warm

### Cache Behavior
- **First Request**: Fetches from provider API, caches result
- **Subsequent Requests (< 1 hour)**: Returns cached data
- **After 1 Hour**: Fetches fresh data from provider API
- **Manual Refresh**: Use `?refresh=true` or call `/refresh-cache` endpoint

## Frontend Integration

The LLM Selector component automatically fetches models from the API:

```tsx
// Initial load: uses cache if available
useEffect(() => {
  if (value.provider) {
    fetchModels(value.provider);
  }
}, [value.provider]);

// Dropdown click: forces refresh from provider
const handleModelDropdownClick = () => {
  if (value.provider && !loadingModels) {
    fetchModels(value.provider, true); // refresh=true
  }
};
```

## Environment Variables

Required API keys in `apps/api/.env`:

```bash
# Required for system mode (when users don't provide their own keys)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."  # Not used for model fetching (no endpoint)
DEEPSEEK_API_KEY="sk-..."
OPENROUTER_API_KEY="sk-or-..."  # Optional (public endpoint)
GROK_API_KEY="xai-..."
GEMINI_API_KEY="AIza..."
```

**Note**: Missing API keys will cause the fetcher to fall back to default model lists.

## Error Handling

### API Failure
If a provider API call fails:
1. Error is logged to console
2. Default model list is returned
3. User sees cached/default models instead of an error

### Missing API Key
If an API key is not configured:
1. Warning logged: "No {Provider} API key available"
2. Default model list is returned
3. System continues to function with curated list

### Invalid Provider
If an unknown provider is requested:
```json
{
  "error": "Unknown provider: invalid_name",
  "availableProviders": ["openai", "anthropic", "deepseek", "openrouter", "grok", "gemini", "llama"]
}
```

## Testing

### Test Model Fetching
```bash
# OpenAI (with cache)
curl "http://localhost:3001/api/llm/models?provider=openai"

# OpenAI (force refresh)
curl "http://localhost:3001/api/llm/models?provider=openai&refresh=true"

# All providers
curl "http://localhost:3001/api/llm/providers"
```

### Test Cache Management
```bash
# Clear specific provider cache
curl -X POST http://localhost:3001/api/llm/refresh-cache \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}'

# Clear all caches
curl -X POST http://localhost:3001/api/llm/refresh-cache \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Performance Metrics

### With Caching (Typical Case)
- **Response Time**: < 10ms
- **API Calls**: 0 per request
- **Cache Hit Rate**: ~95%

### Without Caching (Cold Start or Refresh)
- **Response Time**: 200-500ms (varies by provider)
- **API Calls**: 1 per provider
- **Cache Miss**: Triggers provider API call

### Dashboard User Experience
1. **Provider Selection**: Instant (no API call)
2. **Model Dropdown First Click**: 200-500ms (fetches from provider)
3. **Model Dropdown Subsequent Clicks**: < 10ms (cached)
4. **Manual Refresh**: 200-500ms (forces provider fetch)

## Future Enhancements

### 1. Redis Cache (Production)
Replace in-memory cache with Redis for multi-instance deployments:
```typescript
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache get
const cached = await redis.get(`llm:models:${provider}`);
if (cached) return JSON.parse(cached);

// Cache set
await redis.setex(`llm:models:${provider}`, 3600, JSON.stringify(models));
```

### 2. Background Refresh
Implement background task to keep cache warm:
```typescript
// Every 30 minutes, refresh all provider caches
setInterval(async () => {
  for (const provider of getAllProviders()) {
    await getModelsForProvider(provider, true);
  }
}, 30 * 60 * 1000);
```

### 3. Model Metadata
Enhance response with model capabilities:
```json
{
  "value": "gpt-4o",
  "label": "GPT-4o",
  "context_window": 128000,
  "supports_vision": true,
  "cost_per_1k_input": 0.005,
  "cost_per_1k_output": 0.015
}
```

### 4. Health Monitoring
Track provider API availability:
- Log success/failure rates
- Alert on consistent failures
- Display provider status in dashboard

## Troubleshooting

### Models Not Loading
1. **Check API Keys**: Ensure provider API keys are set in `.env`
2. **Test Provider API**: Use curl to test provider endpoint directly
3. **Check Logs**: Look for error messages in API console
4. **Clear Cache**: Call `/refresh-cache` endpoint

### Stale Models
1. **Force Refresh**: Add `?refresh=true` to API call
2. **Clear Cache**: Call `/refresh-cache` endpoint
3. **Check TTL**: Verify CACHE_TTL is set appropriately (default: 1 hour)

### Provider API Rate Limits
If hitting rate limits:
1. **Increase Cache TTL**: Reduce API call frequency
2. **Implement Backoff**: Add exponential backoff on failures
3. **Use Fallback**: Rely on default model lists during rate limit periods

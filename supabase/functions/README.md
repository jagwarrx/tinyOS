# Supabase Edge Functions

This directory contains Supabase Edge Functions (Deno-based serverless functions).

## Available Functions

### claude-proxy

A secure proxy for calling the Anthropic Claude API from the client app.

**Purpose**:
- Keeps Claude API key secure on the server side
- Avoids CORS issues when calling Anthropic API from browser
- Provides a simple interface for the frontend to call Claude

**Location**: `claude-proxy/index.ts`

**Environment Variables**:
- `CLAUDE_API_KEY` - Your Anthropic API key (set via Supabase secrets)

**Request Format**:
```json
{
  "prompt": "Your prompt here",
  "maxTokens": 1024,
  "temperature": 1.0,
  "model": "claude-3-5-sonnet-20241022"
}
```

**Response Format**:
```json
{
  "text": "Claude's response text"
}
```

**Error Format**:
```json
{
  "error": "Error message"
}
```

## Deployment

### Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref your-project-ref`

### Deploy All Functions
```bash
supabase functions deploy
```

### Deploy Single Function
```bash
supabase functions deploy claude-proxy
```

### Set Secrets
```bash
supabase secrets set CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxx
```

### View Secrets
```bash
supabase secrets list
```

### View Logs
```bash
# All functions
supabase functions logs

# Specific function
supabase functions logs claude-proxy

# Follow/tail logs
supabase functions logs claude-proxy --follow
```

## Local Development

Run function locally:
```bash
supabase functions serve claude-proxy
```

Then call it at: `http://localhost:54321/functions/v1/claude-proxy`

## Testing

Test the deployed function:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/claude-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "prompt": "Tell me a joke",
    "maxTokens": 200
  }'
```

## Architecture

```
Client (React App)
    ↓
Supabase Client SDK
    ↓
Edge Function (claude-proxy)
    ↓
Anthropic Claude API
```

The edge function acts as a secure proxy, keeping your API key server-side and handling all communication with the Anthropic API.

## Security

- API keys are stored in Supabase secrets (encrypted)
- Edge functions run in isolated Deno runtime
- CORS is properly configured
- Client only communicates with Supabase (not directly with Anthropic)

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Anthropic API Documentation](https://docs.anthropic.com/)

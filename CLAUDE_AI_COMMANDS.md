# Claude AI Commands Integration

This app now supports calling Claude AI directly from the terminal for quick AI assistance!

## Setup

This integration uses a Supabase Edge Function to securely call the Claude API. This keeps your API key secure on the server side and avoids CORS issues.

### 1. Get a Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy your new API key

### 2. Install Supabase CLI

If you don't have the Supabase CLI installed:

```bash
npm install -g supabase
```

### 3. Login to Supabase

```bash
supabase login
```

### 4. Link Your Supabase Project

```bash
supabase link --project-ref your-project-ref
```

You can find your project ref in your Supabase project URL: `https://app.supabase.com/project/YOUR-PROJECT-REF`

### 5. Deploy the Edge Function

```bash
supabase functions deploy claude-proxy
```

### 6. Set Claude API Key as a Secret

Store your Claude API key securely in Supabase:

```bash
supabase secrets set CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxx
```

**Important:**
- Never commit your API key to git
- The API key is stored securely in Supabase and only accessible by your edge function
- Keep your API key secure and private

### 7. Test the Integration

Restart your dev server and try a command:

```bash
npm run dev
```

Then in the app terminal, type `/joke` to test!

## Available AI Commands

### Quick Commands

These commands give instant responses for common needs:

```bash
/joke       # Get a programming joke
/tip        # Get a productivity tip
/quote      # Get an inspiring quote
/fact       # Get an interesting tech fact
```

### Interactive Commands

Ask Claude anything or get explanations:

```bash
/ask What is the best way to structure a React app?
/explain recursion
/brainstorm features for a todo app
```

## Examples

```bash
# Get a programming joke
> /joke
🤖 Why do programmers prefer dark mode? Because light attracts bugs!

# Ask a question
> /ask How do I optimize React performance?
🤖 Here are key strategies for optimizing React...

# Get an explanation
> /explain event bubbling in JavaScript
📚 Event bubbling is when an event propagates from...

# Brainstorm ideas
> /brainstorm productivity app features
💭 1. Pomodoro timer integration
   2. Habit tracking dashboard
   3. Focus mode with website blocking...
```

## Usage Notes

### API Costs

- Claude API usage is **pay-per-use**
- Each command costs approximately $0.01-$0.03
- Monitor your usage at https://console.anthropic.com/
- Set up billing limits in your Anthropic account

### Response Time

- Commands typically respond in 2-5 seconds
- Longer prompts may take more time
- The terminal will show the response when ready

### Error Handling

If you see an error like:

```bash
✗ Claude API error: CLAUDE_API_KEY not configured in Supabase Edge Function secrets
```

This means:
1. You haven't deployed the edge function yet, OR
2. You haven't set the CLAUDE_API_KEY secret in Supabase

### Rate Limits

- Anthropic has rate limits on API calls
- If you hit a limit, wait a minute and try again
- Default limits: ~50 requests per minute

## Model Configuration

By default, commands use **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`) - the latest and most capable model.

You can customize this in `src/services/claudeService.js` if needed.

## Advanced Usage

### Custom Prompts

You can extend the system by adding more commands in:
1. `src/utils/commandParser.js` - Add command pattern
2. `src/App.jsx` - Add command handler
3. `src/services/claudeService.js` - Add helper function (optional)

### Example: Add a `/summary` Command

1. Add to commandParser.js:
```javascript
if (lower === '/summary') {
  return { type: 'AI_SUMMARY', payload: {} }
}
```

2. Add to App.jsx handleCommand:
```javascript
case 'AI_SUMMARY': {
  try {
    const summary = await callClaude(
      "Summarize today's most important tech news in 3 bullet points",
      { maxTokens: 300 }
    )
    return `📰 ${summary}`
  } catch (error) {
    return `✗ ${error.message}`
  }
}
```

## Security Best Practices

✅ **DO:**
- Store your API key in Supabase secrets using `supabase secrets set`
- Rotate your API key periodically
- Set up billing alerts in your Anthropic account
- Monitor your API usage regularly

❌ **DON'T:**
- Commit API keys to git
- Share your API key publicly
- Store API keys in client-side code (the Edge Function keeps it server-side)
- Leave unused API keys active

**Why Edge Functions?**
- Your API key never leaves the server
- No CORS issues
- Better security - client code never has access to the key
- Supabase secrets are encrypted and secure

## Troubleshooting

### "API key not configured" Error
- Verify you've deployed the edge function: `supabase functions deploy claude-proxy`
- Check the secret is set: `supabase secrets list`
- Make sure the secret name is exactly `CLAUDE_API_KEY`
- Try redeploying: `supabase functions deploy claude-proxy`

### "Network Error" or Timeout
- Check your internet connection
- Verify API key is valid at https://console.anthropic.com/
- Check Anthropic status: https://status.anthropic.com/
- Verify Supabase project is running

### "Function not found" Error
- Make sure you've linked your Supabase project: `supabase link`
- Deploy the edge function: `supabase functions deploy claude-proxy`
- Check the function exists in your Supabase dashboard under Edge Functions

### Slow Responses
- Normal for complex questions (5-10 seconds)
- Try shorter, more specific prompts
- Check your network speed
- Edge functions add ~100-300ms latency (normal)

### Debugging Edge Function
View edge function logs in real-time:
```bash
supabase functions logs claude-proxy
```

## Cost Estimation

Approximate costs for common commands:

| Command | Tokens | Cost |
|---------|--------|------|
| /joke   | ~200   | $0.001 |
| /tip    | ~200   | $0.001 |
| /ask    | ~500   | $0.002 |
| /explain | ~400  | $0.002 |
| /brainstorm | ~400 | $0.002 |

**Note:** Prices are approximate based on Claude 3.5 Sonnet pricing ($3 per million input tokens, $15 per million output tokens)

---

**Created:** 2025-10-28
**Model:** Claude 3.5 Sonnet
**API Version:** 2023-06-01

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    })
  }

  try {
    // Get Claude API key from environment
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY not configured in Supabase Edge Function secrets')
    }

    // Parse request body
    const { prompt, maxTokens = 1024, temperature = 1.0, model = 'claude-sonnet-4-5' } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Call Claude API
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Claude API error: ${response.status} ${response.statusText}${
          errorData.error?.message ? ` - ${errorData.error.message}` : ''
        }`
      )
    }

    const data = await response.json()

    // Extract text from response
    if (data.content && data.content[0] && data.content[0].text) {
      return new Response(
        JSON.stringify({ text: data.content[0].text }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    throw new Error('Unexpected response format from Claude API')

  } catch (error) {
    console.error('Claude proxy error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})

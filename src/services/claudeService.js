/**
 * Claude AI Service
 * Service for calling Anthropic's Claude API via Supabase Edge Function
 */

import { supabase } from '../supabaseClient'

const CLAUDE_MODEL = 'claude-sonnet-4-5' // Claude Sonnet 4.5

/**
 * Call Claude API with a prompt via Supabase Edge Function
 * @param {string} prompt - The prompt to send to Claude
 * @param {Object} options - Additional options
 * @param {number} options.maxTokens - Maximum tokens in response (default: 1024)
 * @param {number} options.temperature - Temperature for randomness (default: 1.0)
 * @param {string} options.model - Claude model to use
 * @returns {Promise<string>} - Claude's response text
 */
export async function callClaude(prompt, options = {}) {
  const {
    maxTokens = 1024,
    temperature = 1.0,
    model = CLAUDE_MODEL
  } = options

  try {
    const { data, error } = await supabase.functions.invoke('claude-proxy', {
      body: {
        prompt,
        maxTokens,
        temperature,
        model
      }
    })

    if (error) {
      throw new Error(`Claude API error: ${error.message}`)
    }

    if (data && data.text) {
      return data.text
    }

    if (data && data.error) {
      throw new Error(data.error)
    }

    throw new Error('Unexpected response format from Claude API')
  } catch (error) {
    console.error('Claude API error:', error)
    throw error
  }
}

/**
 * Predefined prompts for common commands
 */
export const prompts = {
  joke: "Tell me a short, funny programming joke. Keep it to 2-3 sentences max.",

  tip: "Give me one useful productivity tip for developers. Be brief and actionable.",

  quote: "Share an inspiring quote about technology, programming, or innovation. Include the author.",

  fact: "Tell me an interesting fact about computer science or technology. Keep it brief and fascinating.",

  advice: (topic) => `Give me brief, practical advice about: ${topic}. Keep it concise and actionable.`,

  explain: (concept) => `Explain the following concept in simple terms: ${concept}. Be clear and concise.`,

  summarize: (text) => `Summarize the following text in 2-3 bullet points:\n\n${text}`,

  brainstorm: (topic) => `Give me 5 creative ideas for: ${topic}. List them as brief bullet points.`
}

/**
 * Quick command helpers
 */
export async function getJoke() {
  return await callClaude(prompts.joke, { maxTokens: 200, temperature: 1.0 })
}

export async function getTip() {
  return await callClaude(prompts.tip, { maxTokens: 200 })
}

export async function getQuote() {
  return await callClaude(prompts.quote, { maxTokens: 200 })
}

export async function getFact() {
  return await callClaude(prompts.fact, { maxTokens: 200 })
}

export async function getAdvice(topic) {
  return await callClaude(prompts.advice(topic), { maxTokens: 300 })
}

export async function explainConcept(concept) {
  return await callClaude(prompts.explain(concept), { maxTokens: 400 })
}

export async function summarizeText(text) {
  return await callClaude(prompts.summarize(text), { maxTokens: 300 })
}

export async function brainstormIdeas(topic) {
  return await callClaude(prompts.brainstorm(topic), { maxTokens: 400 })
}

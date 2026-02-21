/**
 * LLM provider adapter. Model-agnostic interface for central brain reasoning.
 * @module hive-core/adapters/llm-provider
 */

/**
 * @typedef {Object} LLMCompleteOptions
 * @property {string} prompt
 * @property {string} [systemPrompt]
 * @property {number} [maxTokens]
 */

/**
 * @typedef {Object} LLMProvider
 * @property {(options: LLMCompleteOptions) => Promise<string>} complete
 */

/**
 * Cursor provider: no-op. When running in Cursor, the main agent IS the central brain;
 * the model is provided by Cursor. Use this when the orchestrator runs inside Cursor.
 * @returns {LLMProvider}
 */
export function createCursorProvider() {
  return {
    async complete({ prompt }) {
      throw new Error(
        'Cursor provider: central brain runs as the main agent. Use Cursor to orchestrate; LLM calls are implicit.'
      );
    },
  };
}

/**
 * Anthropic (Claude) provider.
 * Requires ANTHROPIC_API_KEY or apiKey in options.
 * @param {{ apiKey?: string, model?: string }} [options]
 * @returns {LLMProvider}
 */
export function createAnthropicProvider(options = {}) {
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
  const model = options.model || 'claude-sonnet-4-20250514';

  return {
    async complete({ prompt, systemPrompt, maxTokens = 4096 }) {
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY required for Anthropic provider');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: systemPrompt || undefined,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Anthropic API error: ${res.status} ${text}`);
      }
      const json = await res.json();
      const text = json.content?.[0]?.text;
      return text || '';
    },
  };
}

/**
 * OpenAI provider.
 * Requires OPENAI_API_KEY or apiKey in options.
 * @param {{ apiKey?: string, model?: string }} [options]
 * @returns {LLMProvider}
 */
export function createOpenAIProvider(options = {}) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  const model = options.model || 'gpt-4o';

  return {
    async complete({ prompt, systemPrompt, maxTokens = 4096 }) {
      if (!apiKey) throw new Error('OPENAI_API_KEY required for OpenAI provider');
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenAI API error: ${res.status} ${text}`);
      }
      const json = await res.json();
      return json.choices?.[0]?.message?.content || '';
    },
  };
}

/**
 * Ollama provider (local models).
 * @param {{ baseUrl?: string, model?: string }} [options]
 * @returns {LLMProvider}
 */
export function createOllamaProvider(options = {}) {
  const baseUrl = options.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = options.model || 'llama3';

  return {
    async complete({ prompt, systemPrompt, maxTokens = 4096 }) {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          options: { num_predict: maxTokens },
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama error: ${res.status} ${text}`);
      }
      const json = await res.json();
      return json.message?.content || '';
    },
  };
}

/**
 * Create LLM provider from config.
 * @param {{ type: string, model?: string, apiKeyEnv?: string } | null} config
 * @returns {LLMProvider}
 */
export function createLLMProvider(config) {
  if (!config || config.type === 'cursor') return createCursorProvider();
  const apiKey = config.apiKeyEnv ? process.env[config.apiKeyEnv] : undefined;
  switch (config.type) {
    case 'anthropic':
      return createAnthropicProvider({ apiKey, model: config.model });
    case 'openai':
      return createOpenAIProvider({ apiKey, model: config.model });
    case 'ollama':
      return createOllamaProvider({ model: config.model });
    default:
      return createCursorProvider();
  }
}

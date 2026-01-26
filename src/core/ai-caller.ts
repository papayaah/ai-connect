/**
 * Universal AI Caller - Works in Browser, Deno, and Node.js
 * Uses fetch-based API calls instead of Vercel AI SDK for maximum compatibility
 */

export interface AICallerOptions {
  apiKey: string;
  provider: 'google' | 'openai' | 'anthropic';
  model: string;
}

export interface GenerateObjectOptions<T> extends AICallerOptions {
  system: string;
  prompt: string;
  schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface GenerateTextOptions extends AICallerOptions {
  system: string;
  prompt: string;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateObjectResult<T> {
  object: T;
  usage: AIUsage;
}

export interface GenerateTextResult {
  text: string;
  usage: AIUsage;
}

/**
 * Generate a structured object using AI (fetch-based, works in Deno)
 */
export async function generateObject<T>(
  options: GenerateObjectOptions<T>
): Promise<GenerateObjectResult<T>> {
  const { apiKey, provider, model, system, prompt, schema } = options;

  if (provider === 'google') {
    return generateObjectWithGemini<T>(apiKey, model, system, prompt, schema);
  } else if (provider === 'openai') {
    return generateObjectWithOpenAI<T>(apiKey, model, system, prompt, schema);
  } else if (provider === 'anthropic') {
    return generateObjectWithAnthropic<T>(apiKey, model, system, prompt, schema);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Generate text using AI (fetch-based, works in Deno)
 */
export async function generateText(
  options: GenerateTextOptions
): Promise<GenerateTextResult> {
  const { apiKey, provider, model, system, prompt } = options;

  if (provider === 'google') {
    return generateTextWithGemini(apiKey, model, system, prompt);
  } else if (provider === 'openai') {
    return generateTextWithOpenAI(apiKey, model, system, prompt);
  } else if (provider === 'anthropic') {
    return generateTextWithAnthropic(apiKey, model, system, prompt);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

// =============================================================================
// Google Gemini Implementation
// =============================================================================

async function generateObjectWithGemini<T>(
  apiKey: string,
  model: string,
  system: string,
  prompt: string,
  schema: any
): Promise<GenerateObjectResult<T>> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${system}\n\nRespond with ONLY a JSON object matching this schema: ${JSON.stringify(schema)}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.95,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usageMetadata = data.usageMetadata || {};

  // Parse JSON from response
  const object = parseJsonFromResponse<T>(responseText);

  return {
    object,
    usage: {
      inputTokens: usageMetadata.promptTokenCount || 0,
      outputTokens: usageMetadata.candidatesTokenCount || 0,
    },
  };
}

async function generateTextWithGemini(
  apiKey: string,
  model: string,
  system: string,
  prompt: string
): Promise<GenerateTextResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${system}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  const usageMetadata = data.usageMetadata || {};

  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    usage: {
      inputTokens: usageMetadata.promptTokenCount || 0,
      outputTokens: usageMetadata.candidatesTokenCount || 0,
    },
  };
}

// =============================================================================
// OpenAI Implementation
// =============================================================================

async function generateObjectWithOpenAI<T>(
  apiKey: string,
  model: string,
  system: string,
  prompt: string,
  schema: any
): Promise<GenerateObjectResult<T>> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Respond with ONLY a JSON object matching this schema: ${JSON.stringify(schema)}\n\n${prompt}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};

  const object = parseJsonFromResponse<T>(responseText);

  return {
    object,
    usage: {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
    },
  };
}

async function generateTextWithOpenAI(
  apiKey: string,
  model: string,
  system: string,
  prompt: string
): Promise<GenerateTextResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  const usage = data.usage || {};

  return {
    text: data.choices?.[0]?.message?.content || '',
    usage: {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
    },
  };
}

// =============================================================================
// Anthropic Implementation
// =============================================================================

async function generateObjectWithAnthropic<T>(
  apiKey: string,
  model: string,
  system: string,
  prompt: string,
  schema: any
): Promise<GenerateObjectResult<T>> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [
        { role: 'user', content: `Respond with ONLY a JSON object matching this schema: ${JSON.stringify(schema)}\n\n${prompt}` },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.content?.[0]?.text || '';
  const usage = data.usage || {};

  const object = parseJsonFromResponse<T>(responseText);

  return {
    object,
    usage: {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
    },
  };
}

async function generateTextWithAnthropic(
  apiKey: string,
  model: string,
  system: string,
  prompt: string
): Promise<GenerateTextResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${errorText}`);
  }

  const data = await response.json();
  const usage = data.usage || {};

  return {
    text: data.content?.[0]?.text || '',
    usage: {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
    },
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function parseJsonFromResponse<T>(responseText: string): T {
  let cleanResponse = responseText.trim();

  // Remove markdown code blocks if present
  if (cleanResponse.startsWith('```json')) {
    cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanResponse.startsWith('```')) {
    cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find JSON object boundaries
  const jsonStart = cleanResponse.indexOf('{');
  const jsonEnd = cleanResponse.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
    throw new Error('No valid JSON object found in response');
  }

  const jsonString = cleanResponse.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`);
  }
}

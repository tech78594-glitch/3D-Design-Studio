/**
 * Minimal client for Hugging Face Inference Providers (the chat-completions
 * router, not the older api-inference.huggingface.co endpoint).
 *
 * This calls Hugging Face directly from the browser, which means the token
 * is visible to anyone who opens the deployed site (network tab, or the
 * built JS bundle). That's fine for a personal project with a token scoped
 * to "Make calls to Inference Providers" only — it is NOT fine for a token
 * with write/repo access, or for a paid/rate-limited token you don't want
 * strangers spending. If that matters to you, put this fetch call behind a
 * serverless proxy (Cloudflare Worker, Vercel/Netlify function) that holds
 * the real token server-side instead.
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN as string | undefined;
const HF_MODEL = import.meta.env.VITE_HF_MODEL as string | undefined;

const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';

export interface HuggingFaceOptions {
  /** Override the model configured in VITE_HF_MODEL, e.g. "mistralai/Mistral-7B-Instruct-v0.2". */
  model?: string;
  /** Override the token configured in VITE_HF_TOKEN (e.g. a token a user pastes in at runtime). */
  token?: string;
  /** Sampling temperature passed through to the model. */
  temperature?: number;
  /** Abort the request after this many ms (default 30000). */
  timeoutMs?: number;
}

export class HuggingFaceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'HuggingFaceError';
  }
}

/**
 * Send a single text prompt to a Hugging Face chat model (via Inference
 * Providers) and return its text response.
 */
export async function queryHuggingFace(
  prompt: string,
  options: HuggingFaceOptions = {}
): Promise<string> {
  const model = options.model ?? HF_MODEL;
  const token = options.token ?? HF_TOKEN;

  if (!model) {
    throw new HuggingFaceError(
      'No Hugging Face model configured. Set VITE_HF_MODEL in your .env, or pass { model } explicitly.'
    );
  }
  if (!token) {
    throw new HuggingFaceError(
      'No Hugging Face token configured. Set VITE_HF_TOKEN in your .env, or pass { token } explicitly.'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);

  try {
    const response = await fetch(HF_ROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new HuggingFaceError(
        `Hugging Face request failed (${response.status}): ${detail || response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
      return content;
    }
    return JSON.stringify(data);
  } catch (err) {
    if (err instanceof HuggingFaceError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new HuggingFaceError('Hugging Face request timed out.');
    }
    throw new HuggingFaceError(
      err instanceof Error ? err.message : 'Unknown error calling Hugging Face.'
    );
  } finally {
    clearTimeout(timeout);
  }
}

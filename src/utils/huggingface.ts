/**
 * Minimal client for the Hugging Face Inference API.
 *
 * This calls HF directly from the browser, which means the token in
 * VITE_HF_TOKEN is visible to anyone who opens the deployed site
 * (network tab, or the built JS bundle). That's fine for a personal
 * project with a token scoped to "Inference" only — it is NOT fine for
 * a token with write access, or for a paid/rate-limited token you don't
 * want strangers spending. If that matters to you, put this fetch call
 * behind a serverless proxy (Cloudflare Worker, Vercel/Netlify function)
 * that holds the real token server-side instead.
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN as string | undefined;
const HF_MODEL = import.meta.env.VITE_HF_MODEL as string | undefined;

const HF_INFERENCE_URL = 'https://api-inference.huggingface.co/models';

export interface HuggingFaceOptions {
  /** Override the model configured in VITE_HF_MODEL. */
  model?: string;
  /** Extra generation parameters passed through to the model. */
  parameters?: Record<string, unknown>;
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
 * Send a single text prompt to a Hugging Face model and return its text
 * output. Works with most text-generation / text2text models exposed on
 * the free Inference API.
 */
export async function queryHuggingFace(
  prompt: string,
  options: HuggingFaceOptions = {}
): Promise<string> {
  const model = options.model ?? HF_MODEL;

  if (!model) {
    throw new HuggingFaceError(
      'No Hugging Face model configured. Set VITE_HF_MODEL in your .env, or pass { model } explicitly.'
    );
  }
  if (!HF_TOKEN) {
    throw new HuggingFaceError(
      'No Hugging Face token configured. Set VITE_HF_TOKEN in your .env.'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);

  try {
    const response = await fetch(`${HF_INFERENCE_URL}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: options.parameters,
        // Ask HF to load the model on demand rather than failing
        // immediately if it isn't warm yet.
        options: { wait_for_model: true },
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

    // Response shape varies by model/task. Handle the common ones.
    if (Array.isArray(data) && typeof data[0]?.generated_text === 'string') {
      return data[0].generated_text;
    }
    if (typeof data?.generated_text === 'string') {
      return data.generated_text;
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

/**
 * Robust AI wrapper for Ollama/OpenAI (CommonJS)
 *
 * ENV:
 *   AI_PROVIDER="ollama"|"openai"
 *   AI_MODEL="llama3.1" | "llama3.1:latest" | "gpt-4o-mini" ...
 *   OLLAMA_BASE=http://localhost:11434
 *   OPENAI_API_KEY=sk-...
 *   AI_HTTP_TIMEOUT=90000
 *   AI_RETRIES=3
 *   OLLAMA_NUM_CTX=4096
 *   OLLAMA_NUM_PREDICT=512
 */
const useNodeFetch = typeof fetch === "undefined";
const fetchImpl = useNodeFetch
  ? (...args) => import("node-fetch").then(({ default: f }) => f(...args))
  : (...args) => fetch(...args);

const PROVIDER = (process.env.AI_PROVIDER || "ollama").toLowerCase();
const MODEL = process.env.AI_MODEL || (PROVIDER === "openai" ? "gpt-4o-mini" : "llama3.1");
const OLLAMA_BASE = process.env.OLLAMA_BASE || "http://localhost:11434";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const AI_HTTP_TIMEOUT = Number(process.env.AI_HTTP_TIMEOUT || 90000);
const AI_RETRIES = Math.max(1, Number(process.env.AI_RETRIES || 3));
const OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX || 4096);
const OLLAMA_NUM_PREDICT = Number(process.env.OLLAMA_NUM_PREDICT || process.env.OLLAMA_NUM_PREDICT || 512);

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function fetchWithTimeout(url, opts = {}, timeoutMs = AI_HTTP_TIMEOUT) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchWithRetry(url, opts = {}, { attempts = AI_RETRIES, timeoutMs = AI_HTTP_TIMEOUT, backoffMs = 700 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetchWithTimeout(url, opts, timeoutMs);
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      return r;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await sleep(backoffMs * (i + 1));
    }
  }
  throw lastErr || new Error("Network error");
}

/* --------------------------------- OLLAMA --------------------------------- */
async function chatOllama({ system, messages, temperature = 0.2, top_p = 0.9 }) {
  const url = `${OLLAMA_BASE.replace(/\/+$/,"")}/api/chat`;
  const body = {
    model: MODEL,
    stream: false,
    options: {
      temperature: Math.max(0, Math.min(1, temperature)),
      top_p,
      num_ctx: OLLAMA_NUM_CTX,
      ...(OLLAMA_NUM_PREDICT ? { num_predict: OLLAMA_NUM_PREDICT } : {}),
    },
    messages: [
      ...(system ? [{ role: "system", content: String(system) }] : []),
      ...(messages || []).map(m => ({ role: m.role, content: String(m.content || "") })),
    ],
  };

  const r = await fetchWithRetry(
    url,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    { attempts: AI_RETRIES, timeoutMs: AI_HTTP_TIMEOUT }
  );
  const j = await r.json();
  if (j && j.error) throw new Error(`Ollama error: ${j.error}`);

  const text = (j?.message?.content || j?.content || "").trim();
  if (!text) {
    const alt = Array.isArray(j?.messages) ? j.messages.map(x => x?.content).filter(Boolean).join("\n").trim() : "";
    if (alt) return alt;
    throw new Error("Empty response from Ollama");
  }
  return text;
}

/* --------------------------------- OPENAI --------------------------------- */
async function chatOpenAI({ system, messages, temperature = 0.2 }) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: MODEL,
    temperature: Math.max(0, Math.min(1, temperature)),
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      ...(messages || []),
    ],
  };

  const r = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(body),
    },
    { attempts: AI_RETRIES, timeoutMs: AI_HTTP_TIMEOUT }
  );
  const j = await r.json();
  if (j?.error) throw new Error(`OpenAI error: ${j.error?.message || "unknown"}`);
  const text = (j?.choices?.[0]?.message?.content || "").trim();
  if (!text) throw new Error("Empty response from OpenAI");
  return text;
}

/* ----------------------------- Public Interface ---------------------------- */
async function chat(args) {
  if (PROVIDER === "openai") return chatOpenAI(args);
  if (!/^https?:\/\//i.test(OLLAMA_BASE)) throw new Error(`Invalid OLLAMA_BASE: ${OLLAMA_BASE}`);
  return chatOllama(args);
}

async function providerHealth() {
  try {
    const text = await chat({
      system: "healthcheck",
      messages: [{ role: "user", content: "ping" }],
      temperature: 0,
    });
    if (!text) throw new Error("No text");
    return { provider: PROVIDER, model: MODEL, ok: true, reason: "ok" };
  } catch (e) {
    return { provider: PROVIDER, model: MODEL, ok: false, reason: e?.message || "error" };
  }
}

module.exports = { chat, providerHealth };

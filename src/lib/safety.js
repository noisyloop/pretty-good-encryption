import { useRef, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Input size limits (enforced BEFORE any value reaches openpgp.js).
// Keys/messages are character caps; name/email/passphrase are chars.
// ---------------------------------------------------------------------------
export const LIMITS = {
  key: 10 * 1024, // 10 KB — armored public/private key blocks
  message: 50 * 1024, // 50 KB — plaintext / ciphertext / signed message
  name: 100,
  email: 100,
  passphrase: 200,
};

// Timeouts for crypto operations. openpgp.js can, in rare edge cases, hang on
// malformed input — every call is wrapped so it can never block the UI forever.
export const TIMEOUTS = {
  default: 10_000, // parse / encrypt / decrypt / sign / verify
  generate: 60_000, // RSA-2048 generation is legitimately CPU-heavy
};

// Strip ALL control characters (single-line fields: name, email).
export function cleanLine(value) {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

// Strip control characters but keep tab (\x09), newline (\x0A) and carriage
// return (\x0D) — armored multi-line blocks: keys, ciphertext, signed messages.
export function cleanBlock(value) {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// Returns a human-readable error string if `value` exceeds `max`, else null.
// Rejecting (rather than silently truncating) avoids confusing downstream
// crypto failures from a quietly chopped key.
export function overLimit(value, max, label) {
  const len = typeof value === 'string' ? value.length : 0;
  if (len > max) {
    const size =
      max >= 1024 ? `${Math.round(max / 1024)} KB` : `${max} characters`;
    return `${label} is too large (limit ${size}). Received ${len.toLocaleString()} characters.`;
  }
  return null;
}

// Wrap a promise (or async thunk's promise) so it rejects after `ms`.
export function withTimeout(promise, ms = TIMEOUTS.default, label = 'Operation') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${Math.round(
            ms / 1000
          )}s — the input may be malformed.`
        )
      );
    }, ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() =>
    clearTimeout(timer)
  );
}

// ---------------------------------------------------------------------------
// Client-side rate limiter. There is no server (static Vercel deploy), so this
// is purely abuse-dampening: a per-click cooldown (debounce) plus a sliding
// window cap on how many operations can run in a short period.
// ---------------------------------------------------------------------------
export function useRateLimiter({
  maxOps = 8,
  windowMs = 10_000,
  cooldownMs = 2_000,
} = {}) {
  const stampsRef = useRef([]);
  const [cooling, setCooling] = useState(false);

  // Call before running an op. Returns { ok } or { ok:false, message }.
  const check = useCallback(() => {
    const now = Date.now();
    stampsRef.current = stampsRef.current.filter((t) => now - t < windowMs);
    if (stampsRef.current.length >= maxOps) {
      const wait = Math.ceil((windowMs - (now - stampsRef.current[0])) / 1000);
      return {
        ok: false,
        message: `Too many operations in a short time. Please wait ${wait}s and try again.`,
      };
    }
    return { ok: true };
  }, [maxOps, windowMs]);

  // Call once an op is actually starting: records the timestamp and triggers
  // the cooldown that disables the button for a couple of seconds.
  const record = useCallback(() => {
    stampsRef.current.push(Date.now());
    setCooling(true);
    setTimeout(() => setCooling(false), cooldownMs);
  }, [cooldownMs]);

  return { check, record, cooling };
}

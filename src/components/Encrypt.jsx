import { useState } from 'react';
import * as openpgp from 'openpgp';
import CopyButton from './CopyButton.jsx';
import {
  LIMITS,
  cleanBlock,
  overLimit,
  withTimeout,
  useRateLimiter,
} from '../lib/safety.js';

export default function Encrypt({ keyStore }) {
  const [publicKeyArmored, setPublicKeyArmored] = useState(
    keyStore.publicKey || ''
  );
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { check, record, cooling } = useRateLimiter();

  const handleEncrypt = async () => {
    setError('');
    setCiphertext('');

    const gate = check();
    if (!gate.ok) {
      setError(gate.message);
      return;
    }

    const key = cleanBlock(publicKeyArmored);
    // Plaintext is preserved exactly (no trim/strip) — only length-capped.
    const text = typeof plaintext === 'string' ? plaintext : '';

    if (!key) {
      setError('Please provide a public key.');
      return;
    }
    if (!text) {
      setError('Please enter a message to encrypt.');
      return;
    }

    const sizeError =
      overLimit(key, LIMITS.key, 'Public key') ||
      overLimit(text, LIMITS.message, 'Message');
    if (sizeError) {
      setError(sizeError);
      return;
    }

    record();
    setLoading(true);
    try {
      const encrypted = await withTimeout(
        (async () => {
          const publicKey = await openpgp.readKey({ armoredKey: key });
          return openpgp.encrypt({
            message: await openpgp.createMessage({ text }),
            encryptionKeys: publicKey,
          });
        })(),
        undefined,
        'Encryption'
      );
      setCiphertext(encrypted);
    } catch (err) {
      setError(
        `Encryption failed: ${err?.message || String(err)}. Make sure you pasted a valid PGP public key.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h1 className="panel-title">Encrypt a Message</h1>
      <p className="panel-subtitle">
        Scramble a message with a recipient's public key. Only the matching
        private key can read it.
      </p>

      <div className="card">
        <label className="field">
          <span className="field-label">Recipient's Public Key</span>
          <textarea
            className="textarea mono"
            value={publicKeyArmored}
            onChange={(e) => setPublicKeyArmored(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            rows={8}
            placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
          />
        </label>

        <label className="field">
          <span className="field-label">Message</span>
          <textarea
            className="textarea"
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            rows={5}
            placeholder="Type the secret message you want to encrypt…"
          />
        </label>

        <button
          type="button"
          className="btn-primary"
          onClick={handleEncrypt}
          disabled={loading || cooling}
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? 'Encrypting…' : 'Encrypt'}
        </button>

        {error && <div className="status-error">{error}</div>}
      </div>

      {ciphertext && (
        <div className="card">
          <div className="output-header">
            <span className="field-label">Encrypted Message (ciphertext)</span>
            <CopyButton value={ciphertext} />
          </div>
          <textarea
            className="textarea mono"
            value={ciphertext}
            readOnly
            spellCheck={false}
            autoCorrect="off"
            rows={10}
          />
        </div>
      )}
    </section>
  );
}

import { useState } from 'react';
import * as openpgp from 'openpgp';

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" className="btn-secondary" onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function Encrypt({ keyStore }) {
  const [publicKeyArmored, setPublicKeyArmored] = useState(
    keyStore.publicKey || ''
  );
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEncrypt = async () => {
    setError('');
    setCiphertext('');

    const key = publicKeyArmored.trim();
    if (!key) {
      setError('Please provide a public key.');
      return;
    }
    if (!plaintext) {
      setError('Please enter a message to encrypt.');
      return;
    }

    setLoading(true);
    try {
      const publicKey = await openpgp.readKey({ armoredKey: key });
      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: plaintext }),
        encryptionKeys: publicKey,
      });
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
          disabled={loading}
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

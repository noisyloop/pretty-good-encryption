import { useState } from 'react';
import * as openpgp from 'openpgp';

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for browsers/contexts without the async clipboard API.
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

export default function GenerateKeys({ keyStore, setKeyStore }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const alreadyLoaded = Boolean(keyStore.publicKey && keyStore.privateKey);

  const handleGenerate = async () => {
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please enter a name.');
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter an email address.');
      return;
    }
    // Basic, permissive email sanity check.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. alice@example.com).');
      return;
    }
    if (!passphrase) {
      setError('Please enter a passphrase to protect the private key.');
      return;
    }
    if (passphrase.length < 4) {
      setError('Please choose a passphrase of at least 4 characters.');
      return;
    }

    setLoading(true);
    setPublicKey('');
    setPrivateKey('');
    try {
      const result = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: 2048,
        userIDs: [{ name: trimmedName, email: trimmedEmail }],
        passphrase,
      });
      setPublicKey(result.publicKey);
      setPrivateKey(result.privateKey);
      setKeyStore({
        publicKey: result.publicKey,
        privateKey: result.privateKey,
        passphrase,
      });
    } catch (err) {
      setError(`Could not generate keys: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h1 className="panel-title">Generate Key Pair</h1>
      <p className="panel-subtitle">
        Create a fresh RSA-2048 PGP key pair. The keys are generated in your
        browser and never leave this page.
      </p>

      {alreadyLoaded && (
        <div className="notice-success">
          ✅ A key pair is already loaded into CryptoLab and ready to use across
          the other tabs. Generating again will replace it.
        </div>
      )}

      <div className="card">
        <label className="field">
          <span className="field-label">Name</span>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alice Example"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alice@example.com"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field-label">Passphrase</span>
          <input
            type="password"
            className="input"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="A long, memorable passphrase"
            autoComplete="new-password"
          />
        </label>

        <button
          type="button"
          className="btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? 'Generating…' : 'Generate Key Pair'}
        </button>

        {error && <div className="status-error">{error}</div>}
      </div>

      {publicKey && privateKey && (
        <>
          <div className="card">
            <div className="output-header">
              <span className="field-label">Public Key (share this freely)</span>
              <CopyButton value={publicKey} />
            </div>
            <textarea
              className="textarea mono"
              value={publicKey}
              readOnly
              spellCheck={false}
              autoCorrect="off"
              rows={10}
            />
          </div>

          <div className="card">
            <div className="output-header">
              <span className="field-label">Private Key (keep this secret!)</span>
              <CopyButton value={privateKey} />
            </div>
            <textarea
              className="textarea mono"
              value={privateKey}
              readOnly
              spellCheck={false}
              autoCorrect="off"
              rows={10}
            />
            <div className="info-note">
              Your private key is protected by the passphrase you chose. Never
              share it. CryptoLab keeps it only in memory — it is never written
              to disk or local storage.
            </div>
          </div>
        </>
      )}
    </section>
  );
}

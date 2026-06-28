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

export default function Decrypt({ keyStore }) {
  const [privateKeyArmored, setPrivateKeyArmored] = useState(
    keyStore.privateKey || ''
  );
  const [passphrase, setPassphrase] = useState(keyStore.passphrase || '');
  const [ciphertext, setCiphertext] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDecrypt = async () => {
    setError('');
    setPlaintext('');

    const key = privateKeyArmored.trim();
    const armoredMessage = ciphertext.trim();

    if (!key) {
      setError('Please provide a private key.');
      return;
    }
    if (!armoredMessage) {
      setError('Please paste the encrypted message (ciphertext).');
      return;
    }

    setLoading(true);
    try {
      const privateKeyObj = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: key }),
        passphrase,
      });
      const message = await openpgp.readMessage({
        armoredMessage,
      });
      const { data } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKeyObj,
      });
      setPlaintext(typeof data === 'string' ? data : String(data));
    } catch (err) {
      setError(
        `Decryption failed: ${err?.message || String(err)}. This usually means a wrong passphrase, or a private key that does not match the public key used to encrypt.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h1 className="panel-title">Decrypt a Message</h1>
      <p className="panel-subtitle">
        Unscramble a message that was encrypted with your public key, using your
        passphrase-protected private key.
      </p>

      <div className="card">
        <label className="field">
          <span className="field-label">Your Private Key</span>
          <textarea
            className="textarea mono"
            value={privateKeyArmored}
            onChange={(e) => setPrivateKeyArmored(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            rows={8}
            placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----"
          />
        </label>

        <label className="field">
          <span className="field-label">Passphrase</span>
          <input
            type="password"
            className="input"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="The passphrase that protects your private key"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field-label">Encrypted Message (ciphertext)</span>
          <textarea
            className="textarea mono"
            value={ciphertext}
            onChange={(e) => setCiphertext(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            rows={8}
            placeholder="-----BEGIN PGP MESSAGE-----"
          />
        </label>

        <button
          type="button"
          className="btn-primary"
          onClick={handleDecrypt}
          disabled={loading}
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? 'Decrypting…' : 'Decrypt'}
        </button>

        {error && <div className="status-error">{error}</div>}
      </div>

      {plaintext && (
        <div className="card">
          <div className="output-header">
            <span className="field-label">Decrypted Message</span>
            <CopyButton value={plaintext} />
          </div>
          <textarea
            className="textarea"
            value={plaintext}
            readOnly
            spellCheck={false}
            autoCorrect="off"
            rows={6}
          />
        </div>
      )}
    </section>
  );
}

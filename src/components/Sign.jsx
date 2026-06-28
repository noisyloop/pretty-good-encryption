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

export default function Sign({ keyStore }) {
  const [privateKeyArmored, setPrivateKeyArmored] = useState(
    keyStore.privateKey || ''
  );
  const [passphrase, setPassphrase] = useState(keyStore.passphrase || '');
  const [messageText, setMessageText] = useState('');
  const [signed, setSigned] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { check, record, cooling } = useRateLimiter();

  const handleSign = async () => {
    setError('');
    setSigned('');

    const gate = check();
    if (!gate.ok) {
      setError(gate.message);
      return;
    }

    const key = cleanBlock(privateKeyArmored);
    const pass = typeof passphrase === 'string' ? passphrase : '';
    // Message is preserved exactly (no trim/strip) — only length-capped.
    const text = typeof messageText === 'string' ? messageText : '';

    if (!key) {
      setError('Please provide a private key.');
      return;
    }
    if (!text) {
      setError('Please enter a message to sign.');
      return;
    }

    const sizeError =
      overLimit(key, LIMITS.key, 'Private key') ||
      overLimit(pass, LIMITS.passphrase, 'Passphrase') ||
      overLimit(text, LIMITS.message, 'Message');
    if (sizeError) {
      setError(sizeError);
      return;
    }

    record();
    setLoading(true);
    try {
      const result = await withTimeout(
        (async () => {
          const privateKeyObj = await openpgp.decryptKey({
            privateKey: await openpgp.readPrivateKey({ armoredKey: key }),
            passphrase: pass,
          });
          return openpgp.sign({
            message: await openpgp.createMessage({ text }),
            signingKeys: privateKeyObj,
          });
        })(),
        undefined,
        'Signing'
      );
      setSigned(result);
    } catch (err) {
      setError(
        `Signing failed: ${err?.message || String(err)}. Check that the private key is valid and the passphrase is correct.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h1 className="panel-title">Sign a Message</h1>
      <p className="panel-subtitle">
        Prove a message came from you and was not altered. Signing does not hide
        the message — it authenticates it.
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
            maxLength={LIMITS.passphrase}
          />
        </label>

        <label className="field">
          <span className="field-label">Message</span>
          <textarea
            className="textarea"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={5}
            placeholder="Type the message you want to sign…"
          />
        </label>

        <button
          type="button"
          className="btn-primary"
          onClick={handleSign}
          disabled={loading || cooling}
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? 'Signing…' : 'Sign'}
        </button>

        {error && <div className="status-error">{error}</div>}
      </div>

      {signed && (
        <div className="card">
          <div className="output-header">
            <span className="field-label">Signed Message</span>
            <CopyButton value={signed} />
          </div>
          <textarea
            className="textarea mono"
            value={signed}
            readOnly
            spellCheck={false}
            autoCorrect="off"
            rows={12}
          />
          <div className="info-note">
            Recipients can verify this with your public key.
          </div>
        </div>
      )}
    </section>
  );
}

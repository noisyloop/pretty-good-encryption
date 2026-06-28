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

export default function Decrypt({ keyStore }) {
  const [privateKeyArmored, setPrivateKeyArmored] = useState(
    keyStore.privateKey || ''
  );
  const [passphrase, setPassphrase] = useState(keyStore.passphrase || '');
  const [ciphertext, setCiphertext] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { check, record, cooling } = useRateLimiter();

  const handleDecrypt = async () => {
    setError('');
    setPlaintext('');

    const gate = check();
    if (!gate.ok) {
      setError(gate.message);
      return;
    }

    const key = cleanBlock(privateKeyArmored);
    const armoredMessage = cleanBlock(ciphertext);
    const pass = typeof passphrase === 'string' ? passphrase : '';

    if (!key) {
      setError('Please provide a private key.');
      return;
    }
    if (!armoredMessage) {
      setError('Please paste the encrypted message (ciphertext).');
      return;
    }

    const sizeError =
      overLimit(key, LIMITS.key, 'Private key') ||
      overLimit(pass, LIMITS.passphrase, 'Passphrase') ||
      overLimit(armoredMessage, LIMITS.message, 'Ciphertext');
    if (sizeError) {
      setError(sizeError);
      return;
    }

    record();
    setLoading(true);
    try {
      const data = await withTimeout(
        (async () => {
          const privateKeyObj = await openpgp.decryptKey({
            privateKey: await openpgp.readPrivateKey({ armoredKey: key }),
            passphrase: pass,
          });
          const message = await openpgp.readMessage({ armoredMessage });
          const result = await openpgp.decrypt({
            message,
            decryptionKeys: privateKeyObj,
          });
          return result.data;
        })(),
        undefined,
        'Decryption'
      );
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
            maxLength={LIMITS.passphrase}
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
          disabled={loading || cooling}
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

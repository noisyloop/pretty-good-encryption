import { useState } from 'react';
import * as openpgp from 'openpgp';
import {
  LIMITS,
  cleanBlock,
  overLimit,
  withTimeout,
  useRateLimiter,
} from '../lib/safety.js';

export default function Verify({ keyStore }) {
  const [publicKeyArmored, setPublicKeyArmored] = useState(
    keyStore.publicKey || ''
  );
  const [signedMessage, setSignedMessage] = useState('');
  const [result, setResult] = useState(null); // { valid: boolean, detail: string }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { check, record, cooling } = useRateLimiter();

  const handleVerify = async () => {
    setError('');
    setResult(null);

    const gate = check();
    if (!gate.ok) {
      setError(gate.message);
      return;
    }

    const key = cleanBlock(publicKeyArmored);
    const armoredMessage = cleanBlock(signedMessage);

    if (!key) {
      setError('Please provide a public key.');
      return;
    }
    if (!armoredMessage) {
      setError('Please paste the signed message.');
      return;
    }

    const sizeError =
      overLimit(key, LIMITS.key, 'Public key') ||
      overLimit(armoredMessage, LIMITS.message, 'Signed message');
    if (sizeError) {
      setError(sizeError);
      return;
    }

    record();
    setLoading(true);
    try {
      const signatures = await withTimeout(
        (async () => {
          const publicKey = await openpgp.readKey({ armoredKey: key });
          const message = await openpgp.readMessage({ armoredMessage });
          const verified = await openpgp.verify({
            message,
            verificationKeys: publicKey,
          });
          return verified.signatures;
        })(),
        undefined,
        'Verification'
      );

      if (!signatures || signatures.length === 0) {
        setResult({
          valid: false,
          detail: 'The message does not contain any signature.',
        });
        return;
      }

      // Awaiting `verified` throws if the signature is invalid or made by a
      // different key, so catch that specifically and report an INVALID result.
      try {
        await withTimeout(signatures[0].verified, undefined, 'Verification');
        setResult({
          valid: true,
          detail:
            'The signature is valid — this message was signed by the matching private key and has not been altered.',
        });
      } catch (verifyErr) {
        setResult({
          valid: false,
          detail: `The signature is not valid for this public key (${
            verifyErr?.message || String(verifyErr)
          }). The message may have been altered, or it was signed by a different key.`,
        });
      }
    } catch (err) {
      setError(
        `Could not verify: ${err?.message || String(err)}. Make sure you pasted a valid PGP public key and a valid signed message.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h1 className="panel-title">Verify a Signature</h1>
      <p className="panel-subtitle">
        Confirm a signed message really came from the holder of a given public
        key and was not tampered with.
      </p>

      <div className="card">
        <label className="field">
          <span className="field-label">Signer's Public Key</span>
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
          <span className="field-label">Signed Message</span>
          <textarea
            className="textarea mono"
            value={signedMessage}
            onChange={(e) => setSignedMessage(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            rows={10}
            placeholder="-----BEGIN PGP MESSAGE-----"
          />
        </label>

        <button
          type="button"
          className="btn-primary"
          onClick={handleVerify}
          disabled={loading || cooling}
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? 'Verifying…' : 'Verify'}
        </button>

        {error && <div className="status-error">{error}</div>}
      </div>

      {result && (
        <div
          className={`result-badge ${result.valid ? 'result-valid' : 'result-invalid'}`}
        >
          <div className="result-headline">
            {result.valid ? '✅ VALID' : '❌ INVALID'}
          </div>
          <div className="result-detail">{result.detail}</div>
        </div>
      )}
    </section>
  );
}

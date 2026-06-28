import { useState } from 'react';

const CONCEPTS = [
  {
    title: 'What is PGP?',
    body: 'PGP (Pretty Good Privacy) is an encryption standard created in 1991. OpenPGP is the open specification. It uses public-key cryptography: a key pair where the public key encrypts and verifies, the private key decrypts and signs. Keys include a name and email, making it easy to associate a key with a person.',
  },
  {
    title: 'What is a key pair?',
    body: 'Two mathematically linked keys. The public key can be shared freely — post it on your website, send it to anyone. The private key is protected by a passphrase and must be kept secret. What one key locks, only the other can unlock.',
  },
  {
    title: 'What is encryption?',
    body: "Scrambles a message using the recipient's public key so only their private key can unscramble it. PGP actually encrypts the message with a random AES session key, then encrypts that session key with the recipient's RSA public key. This is called hybrid encryption and is why PGP can encrypt large messages efficiently.",
  },
  {
    title: 'What is a digital signature?',
    body: 'Proves a message came from you and was not altered. You sign with your private key; anyone with your public key can verify it. Signing does not hide the message — it only proves authenticity and integrity. For confidential signed messages, use both signing and encryption.',
  },
  {
    title: 'What is a passphrase?',
    body: 'PGP private keys are stored encrypted, protected by a passphrase. This means even if someone gets your private key file, they cannot use it without the passphrase. Choose a long, memorable passphrase — not a password. "correct horse battery staple" is better than "P@ssw0rd!".',
  },
  {
    title: 'What is armored format?',
    body: 'PGP keys and messages are often shared as ASCII armored text — base64-encoded data wrapped in -----BEGIN PGP PUBLIC KEY BLOCK----- headers. This format is human-readable, easy to copy-paste, and works in email, on websites, and in config files.',
  },
];

export default function Learn() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="panel">
      <h1 className="panel-title">Learn the Concepts</h1>
      <p className="panel-subtitle">
        Six short cards covering the ideas behind PGP. Open one at a time.
      </p>

      <div className="accordion">
        {CONCEPTS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.title}
              className={`accordion-item${isOpen ? ' open' : ''}`}
            >
              <button
                type="button"
                className="accordion-header"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
              >
                <span>{item.title}</span>
                <span className="chevron" aria-hidden="true">
                  ›
                </span>
              </button>
              <div className="accordion-body">
                <p>{item.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

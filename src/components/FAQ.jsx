import { useState } from 'react';

const QUESTIONS = [
  {
    title: 'Decryption fails with "Error decrypting message"',
    body: 'Most likely a wrong passphrase, or using a private key that does not match the public key used to encrypt. The key pair must be the same.',
  },
  {
    title: "What's the difference between Sign and Encrypt?",
    body: 'Encrypt hides the content. Sign proves who wrote it. For sensitive messages you also want authenticated, do both: encrypt first, then sign, or use a combined encrypt+sign function.',
  },
  {
    title: 'Can I use these keys with GPG?',
    body: 'Yes. The armored key format is standard OpenPGP. Copy the private key into a file, then run: gpg --import mykey.asc',
  },
  {
    title: 'Why does encryption output look different every time?',
    body: 'PGP generates a fresh random session key each time. This is intentional and a security feature.',
  },
  {
    title: 'Should I use 2048-bit or 4096-bit RSA?',
    body: '2048-bit is secure for most purposes today. 4096-bit is more future-proof but noticeably slower to generate and use. For learning, 2048-bit is fine.',
  },
  {
    title: 'How do I share my public key?',
    body: 'Copy the armored public key block and send it via email, paste it on your website, or upload it to a public key server like keys.openpgp.org.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="panel">
      <h1 className="panel-title">Frequently Asked Questions</h1>
      <p className="panel-subtitle">
        Common questions and troubleshooting tips.
      </p>

      <div className="accordion">
        {QUESTIONS.map((item, index) => {
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

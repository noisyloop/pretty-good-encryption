# pretty-good-encryption

**An interactive PGP cryptography education tool that runs entirely in your browser.**



pretty-good-encryption makes PGP tangible. Generate real keypairs, encrypt and decrypt messages, sign and verify — all client-side, all in one tab. No accounts, no servers, no data leaves your machine.

---

## Features

- **Key Generation** — create RSA or ECC keypairs with a name, email, and optional passphrase
- **Encrypt / Decrypt** — paste a recipient's public key and encrypt any message; decrypt with your private key
- **Sign / Verify** — sign messages to prove authorship; verify signatures against a known public key
- **Key Inspector** — parse and display key metadata (fingerprint, algorithm, creation date, expiry)
- **100% client-side** — all cryptographic operations run in the browser via [openpgp.js](https://openpgpjs.org/); nothing is transmitted or stored externally

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Crypto library | openpgp.js v5 |
| Fonts | Ubuntu / Ubuntu Mono (Google Fonts) |
| Deployment | Vercel |

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/noisyloop/pretty-good-encryption.git
cd pretty-good-encryption
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
npm run preview   # verify the production build locally
```

The output lands in `dist/` and is ready to deploy anywhere that serves static files — Vercel, Netlify, Cloudflare Pages, or a plain nginx box.

---

## Project Structure

```
pretty-good-encryption/
├── src/               # React components and crypto logic
├── index.html         # Vite entry point
├── vite.config.js     # Vite configuration
├── vercel.json        # Vercel deployment settings
└── package.json
```

---

## Security Notes

- Private keys are never sent anywhere — all operations are in-memory in your browser session.
- Keys are not persisted; refreshing the page clears them. Copy anything you want to keep.
- This tool is intended for **learning and experimentation**. For production key management, use a dedicated tool like GPG, Kleopatra, or a hardware security key.

---

## License

[MIT](LICENSE) — do whatever you want, just don't blame me if your secrets end up on a sticky note.

---

*Built by [noisyloop](https://github.com/noisyloop)*

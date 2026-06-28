import { useState } from 'react';
import Nav from './components/Nav.jsx';
import Learn from './components/Learn.jsx';
import GenerateKeys from './components/GenerateKeys.jsx';
import Encrypt from './components/Encrypt.jsx';
import Decrypt from './components/Decrypt.jsx';
import Sign from './components/Sign.jsx';
import Verify from './components/Verify.jsx';
import FAQ from './components/FAQ.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('Learn');
  const [keyStore, setKeyStore] = useState({
    publicKey: '', // armored PGP public key string
    privateKey: '', // armored PGP private key string
    passphrase: '', // passphrase used to protect the private key
  });

  const sharedProps = { keyStore, setKeyStore };

  const tabs = {
    Learn: <Learn />,
    'Generate Keys': <GenerateKeys {...sharedProps} />,
    Encrypt: <Encrypt {...sharedProps} />,
    Decrypt: <Decrypt {...sharedProps} />,
    Sign: <Sign {...sharedProps} />,
    Verify: <Verify {...sharedProps} />,
    FAQ: <FAQ />,
  };

  return (
    <div className="app">
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main">{tabs[activeTab] || tabs.Learn}</main>
      <footer className="footer">
        <p>
          CryptoLab runs entirely in your browser. No data is ever sent to a
          server. Private keys are never saved.
        </p>
      </footer>
    </div>
  );
}

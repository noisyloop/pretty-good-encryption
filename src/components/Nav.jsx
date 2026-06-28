const TABS = [
  'Learn',
  'Generate Keys',
  'Encrypt',
  'Decrypt',
  'Sign',
  'Verify',
  'FAQ',
];

export default function Nav({ activeTab, setActiveTab }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <span className="nav-title">🔐 CryptoLab</span>
        <div className="nav-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`nav-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

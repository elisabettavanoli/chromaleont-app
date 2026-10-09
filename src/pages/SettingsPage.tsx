import { useState } from 'react'

function SettingsPage() {
    const [isConnected, setIsConnected] = useState(false)
    const [deviceName] = useState('Chromaleont')

    function toggleConnection() {
        setIsConnected((current) => !current)
    }

    return (
        <main className="page">
            <header>
                <h1>Settings</h1>
                <p className="subtitle">Manage your device</p>
            </header>

            <section className="section">
                <h2>Bluetooth connection</h2>
                <p>
                    Connect your phone to your Chromaleont device.
                </p>

                <div className="connection-status">
          <span
              className={`status-indicator ${
                  isConnected ? 'connected' : 'disconnected'
              }`}
              aria-hidden="true"
          />

                    <div>
                        <strong>
                            {isConnected ? 'Connected' : 'Not connected'}
                        </strong>
                        <p>{deviceName}</p>
                    </div>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={toggleConnection}
                    aria-pressed={isConnected}
                >
                    {isConnected ? 'Disconnect device' : 'Connect device'}
                </button>

                <p className="settings-note">
                    Bluetooth connection is simulated in this version.
                </p>
            </section>

            <section className="section">
                <h2>About</h2>

                <div className="settings-row">
                    <span>App</span>
                    <span>Chromaleont</span>
                </div>

                <div className="settings-row">
                    <span>Version</span>
                    <span>0.1.0</span>
                </div>
            </section>
        </main>
    )
}

export default SettingsPage
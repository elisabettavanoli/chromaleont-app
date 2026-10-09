import { useState } from 'react'
import { useAppState } from '../useAppState'
import { Chameleon } from '../components'

function SettingsPage() {
    const { isConnected, setIsConnected, isOn, selectedColor } = useAppState()
    const [connecting, setConnecting] = useState(false)
    function toggleConnection() {
        if (isConnected) { setIsConnected(false); return }
        setConnecting(true)
        window.setTimeout(() => { setIsConnected(true); setConnecting(false) }, 1100)
    }
    return <main className="page settings-page">
        <header className="screen-header"><p>Device</p><h1>Settings</h1></header>
        <section className="connection-card" aria-label="Device connection">
            <div className="connection-summary"><div className="mini-stage"><Chameleon color={selectedColor.hex} colorName={selectedColor.name} isOn={isConnected && isOn} /></div><div className="connection-text" role="status" aria-live="polite"><strong><i className={`connection-dot ${connecting ? 'connecting' : isConnected ? 'connected' : ''}`} />{connecting ? 'Connecting…' : isConnected ? 'Connected' : 'Not connected'}</strong><span>{connecting ? 'Looking for Chromaleont nearby' : isConnected ? 'Bluetooth · Strong signal' : 'Keep Chromaleont within 10 m of your phone'}</span></div></div>
            <button className={`connect-button ${isConnected ? 'disconnect' : ''}`} type="button" onClick={toggleConnection} disabled={connecting}><BluetoothIcon />{connecting ? 'Connecting to Chromaleont' : isConnected ? 'Disconnect' : 'Connect to Chromaleont'}</button>
        </section>
        <section className="about-device"><h2>About this device</h2><dl><InfoRow label="Name" value="Chromaleont"/><InfoRow label="Model" value="Chromaleont C1"/><InfoRow label="Firmware" value="2.4.1 · Up to date"/><InfoRow label="Battery" value={isConnected ? <span className="battery"><i><b /></i>82%</span> : '—'}/><InfoRow label="Serial number" value="CHL-24-08-1137" mono/></dl><p className="settings-note">Bluetooth connection is simulated in this version.</p></section>
    </main>
}
function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) { return <div className="info-row"><dt>{label}</dt><dd className={mono ? 'mono' : ''}>{value}</dd></div> }
function BluetoothIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10-5 5V2l5 5L7 17" /></svg> }
export default SettingsPage

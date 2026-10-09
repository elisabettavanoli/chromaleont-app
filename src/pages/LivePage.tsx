import { Link } from 'react-router'
import { COLORS } from '../constants/colors'
import { Chameleon, MoodIcon } from '../components'
import { useAppState } from '../useAppState'

function LivePage() {
    const { isOn, setIsOn, selectedColor, setSelectedColor, isConnected } = useAppState()
    return <main className="page live-page">
        <header className="screen-header"><p>Good afternoon</p><h1>Live</h1></header>
        {!isConnected && <div className="offline-banner"><span className="bluetooth-icon" aria-hidden="true">ᛒ</span><p>Chromaleont is out of reach. Reconnect to change colors.</p><Link to="/settings">Connect</Link></div>}
        <section className={`robot-stage ${isOn ? 'is-on' : 'is-off'}`} aria-label="Chameleon preview" style={{ '--mood-color': isOn ? selectedColor.hex : '#C9C4BC' } as React.CSSProperties}>
            <div className="stage-orb" aria-hidden="true" />
            <div className="stage-labels"><span><i />{isOn ? selectedColor.name : 'Off'}</span><span>{isConnected ? 'Synced just now' : 'Not synced'}</span></div>
            <div className={`chameleon-wrap ${isOn ? 'animate-lizard' : ''}`}><Chameleon color={selectedColor.hex} colorName={selectedColor.name} isOn={isOn} /></div>
            <div className="stage-copy" aria-live="polite"><h2>{isOn ? `Chromaleont is ${selectedColor.name.toLowerCase()}` : 'Chromaleont is resting'}</h2><p>{isOn ? description(selectedColor.name) : 'Turn Chromaleont on to bring back the color'}</p></div>
        </section>
        <section className="power-card"><span className="power-icon" style={{ backgroundColor: isOn ? selectedColor.hex : '#ffeedd', color: moodTextColor(selectedColor.name) }}><PowerIcon /></span><div className="power-copy"><strong>Power</strong><span>{isOn ? 'On · glowing now' : 'Off · color paused'}</span></div><button className={`switch large ${isOn ? 'checked' : ''}`} type="button" role="switch" aria-checked={isOn} aria-label="Chameleon power" onClick={() => setIsOn(!isOn)}><i /></button></section>
        <section className="mood-section"><div className="section-heading"><h2>Choose a color</h2><span>Tap to apply instantly</span></div><div className="mood-grid" role="radiogroup" aria-label="Chameleon color">{COLORS.map((color) => { const active = selectedColor.name === color.name && isOn; return <button key={color.name} type="button" role="radio" aria-checked={active} disabled={!isConnected} className={`mood-option ${active ? 'selected' : ''}`} onClick={() => { setSelectedColor(color); setIsOn(true) }}><span className="mood-icon" style={{ backgroundColor: color.hex, color: moodTextColor(color.name) }}><MoodIcon name={color.name} /></span><strong>{color.name}</strong>{active && <span className="mood-check">✓</span>}</button> })}</div></section>
    </main>
}
function description(name: string) { return ({ Cold: 'Calm, cool and curled up', Sleepy: 'Dimmed glow, winding down', Hungry: 'Wide-eyed and asking for snacks', Playful: 'Bright, bouncy and ready to play' }[name] ?? '') }
function moodTextColor(name: string) { return name === 'Sleepy' ? '#fff' : name === 'Hungry' ? '#2b0603' : name === 'Cold' ? '#0b2a3a' : '#0d2b05' }
function PowerIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v10M6.3 5.8a8 8 0 1 0 11.4 0" /></svg> }
export default LivePage

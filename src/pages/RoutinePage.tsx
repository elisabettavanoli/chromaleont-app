import { useState, type FormEvent } from 'react'
import { COLORS } from '../constants/colors'
import type { RoutineEntry } from '../appStateContext'
import { useAppState } from '../useAppState'
import { MoodIcon } from '../components'

function RoutinePage() {
    const { routine, setRoutine, routineEnabled, setRoutineEnabled } = useAppState()
    const [time, setTime] = useState('18:00')
    const [colorName, setColorName] = useState<string>(COLORS[0].name)
    const activeCount = routine.filter((item) => item.enabled && routineEnabled).length
    const active = routine.filter((item) => item.enabled && routineEnabled).sort((a, b) => a.time.localeCompare(b.time))
    const segments = active.flatMap((entry, index) => {
        const start = minutes(entry.time)
        const end = index < active.length - 1 ? minutes(active[index + 1].time) : 1440
        const parts = [{ id: String(entry.id), start, end, colorName: entry.colorName }]
        if (index === 0 && start > 0) parts.unshift({ id: `${entry.id}-wrap`, start: 0, end: start, colorName: active[active.length - 1].colorName })
        return parts
    })

    function saveEntry(event: FormEvent) {
        event.preventDefault()
        if (!time) return
        const next: RoutineEntry = { id: Date.now(), time, colorName, enabled: true }
        setRoutine((current) => [...current, next].sort((a, b) => a.time.localeCompare(b.time)))
    }
    function updateEntry(id: number, changes: Partial<RoutineEntry>) {
        setRoutine((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item).sort((a, b) => a.time.localeCompare(b.time)))
    }

    return <main className="page routine-page">
        <header className="screen-header"><p>{activeCount} of {routine.length} changes active</p><h1>Routine</h1></header>
        <section className="day-strip"><strong>Chromaleont&apos;s day at a glance</strong><div className="timeline" role="img" aria-label={active.length ? `Timeline: ${active.map((e) => `${e.colorName} at ${e.time}`).join(', ')}` : 'Timeline is empty'}>{segments.map((segment) => <i key={segment.id} style={{ left: `${segment.start / 1440 * 100}%`, width: `${Math.max((segment.end - segment.start) / 1440 * 100, 1)}%`, backgroundColor: hex(segment.colorName) }} />)}</div><div className="timeline-labels"><span>12 AM</span><span>6 AM</span><span>Noon</span><span>6 PM</span><span>12 AM</span></div></section>
        <section className="schedule-section"><div className="schedule-title"><h2>Every day</h2><button type="button" role="switch" aria-checked={routineEnabled} className={`switch ${routineEnabled ? 'checked' : ''}`} aria-label="Enable entire routine" onClick={() => setRoutineEnabled(!routineEnabled)}><i /></button></div>
            {!routine.length ? <p className="empty-state">No color changes yet. Add one below and Chromaleont will follow it every day.</p> : <ul className="routine-list">{routine.map((entry) => <RoutineRow key={entry.id} entry={entry} onUpdate={(changes) => updateEntry(entry.id, changes)} onRemove={() => setRoutine((current) => current.filter((item) => item.id !== entry.id))} />)}</ul>}
        </section>
        <form className="add-routine" onSubmit={saveEntry}><h2>Add a color change</h2><label htmlFor="routine-time">Time</label><input id="routine-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} /><fieldset><legend>Color</legend><div className="routine-color-picker" role="radiogroup" aria-label="Routine color">{COLORS.map((color) => <button type="button" role="radio" aria-checked={colorName === color.name} key={color.name} className={colorName === color.name ? 'chosen' : ''} onClick={() => setColorName(color.name)}><span style={{ backgroundColor: color.hex }}><MoodIcon name={color.name} size={16} /></span><small>{color.name}</small></button>)}</div></fieldset><button className="primary-button add-button" type="submit"><b aria-hidden="true">＋</b>Add to routine</button></form>
    </main>
}

function RoutineRow({ entry, onUpdate, onRemove }: { entry: RoutineEntry; onUpdate: (changes: Partial<RoutineEntry>) => void; onRemove: () => void }) {
    const [editing, setEditing] = useState(false)
    return <li className={`routine-row ${entry.enabled ? '' : 'paused'}`}><span className="routine-mood" style={{ backgroundColor: hex(entry.colorName), color: textColor(entry.colorName) }}><MoodIcon name={entry.colorName} size={20} /></span><div className="routine-description"><strong>{formatTime(entry.time)}</strong><span>{entry.enabled ? `Turns ${entry.colorName}` : `${entry.colorName} · paused`}</span></div><button type="button" className={`switch ${entry.enabled ? 'checked' : ''}`} role="switch" aria-checked={entry.enabled} aria-label={`${entry.enabled ? 'Disable' : 'Enable'} ${entry.colorName} at ${entry.time}`} onClick={() => onUpdate({ enabled: !entry.enabled })}><i /></button><button className="icon-button edit-button" type="button" aria-label={`Edit ${entry.colorName} at ${entry.time}`} onClick={() => setEditing(!editing)}><EditIcon /></button><button className="icon-button delete-button" type="button" aria-label={`Remove ${entry.colorName} at ${entry.time}`} onClick={onRemove}><TrashIcon /></button>{editing && <div className="inline-editor"><label>Time<input type="time" value={entry.time} onChange={(event) => onUpdate({ time: event.target.value })} /></label><label>Color<select value={entry.colorName} onChange={(event) => onUpdate({ colorName: event.target.value })}>{COLORS.map((color) => <option key={color.name}>{color.name}</option>)}</select></label><button type="button" className="editor-done" onClick={() => setEditing(false)}>Done</button></div>}</li>
}
function EditIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /></svg> }
function TrashIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg> }
function minutes(time: string) { const [h, m] = time.split(':').map(Number); return h * 60 + m }
function formatTime(time: string) { const [h, m] = time.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` }
function hex(name: string) { return COLORS.find((color) => color.name === name)?.hex ?? COLORS[0].hex }
function textColor(name: string) { return name === 'Sleepy' ? '#fff' : name === 'Hungry' ? '#2b0603' : name === 'Cold' ? '#0b2a3a' : '#0d2b05' }
export default RoutinePage

import { useState } from 'react'
import { COLORS } from '../constants/colors'

interface RoutineEntry {
    id: number
    time: string
    colorName: string
    colorHex: string
    enabled: boolean
}

function RoutinePage() {
    const [routine, setRoutine] = useState<RoutineEntry[]>([
        {
            id: 1,
            time: '08:00',
            colorName: 'Cold',
            colorHex: '#82D7FF',
            enabled: true,
        },
        {
            id: 2,
            time: '12:30',
            colorName: 'Hungry',
            colorHex: '#FF3C28',
            enabled: true,
        },
        {
            id: 3,
            time: '20:00',
            colorName: 'Sleepy',
            colorHex: '#4600B4',
            enabled: true,
        },
    ])

    const [time, setTime] = useState('09:00')
    const [colorName, setColorName] = useState<string>(COLORS[0].name)
    const [routineEnabled, setRoutineEnabled] = useState(true)

    function addEntry() {
        const selectedColor = COLORS.find(
            (color) => color.name === colorName,
        )

        if (!selectedColor || !time) {
            return
        }

        const newEntry: RoutineEntry = {
            id: Date.now(),
            time,
            colorName: selectedColor.name,
            colorHex: selectedColor.hex,
            enabled: true,
        }

        setRoutine((current) =>
            [...current, newEntry].sort((a, b) =>
                a.time.localeCompare(b.time),
            ),
        )
    }

    function removeEntry(id: number) {
        setRoutine((current) =>
            current.filter((entry) => entry.id !== id),
        )
    }

    function toggleEntry(id: number) {
        setRoutine((current) =>
            current.map((entry) =>
                entry.id === id
                    ? { ...entry, enabled: !entry.enabled }
                    : entry,
            ),
        )
    }

    return (
        <main className="page">
            <header>
                <h1>Routine</h1>
                <p className="subtitle">Plan your daily colors</p>
            </header>

            <section className="section">
                <div className="routine-header">
                    <div>
                        <h2>Daily routine</h2>
                        <p>
                            {routineEnabled ? 'Routine enabled' : 'Routine disabled'}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="routine-toggle"
                        onClick={() => setRoutineEnabled((current) => !current)}
                        aria-pressed={routineEnabled}
                    >
                        {routineEnabled ? 'On' : 'Off'}
                    </button>
                </div>

                {routine.length === 0 ? (
                    <p>No scheduled colors yet.</p>
                ) : (
                    <div className="routine-list">
                        {routine.map((entry) => (
                            <div className="routine-entry" key={entry.id}>
                <span
                    className="routine-color"
                    style={{ backgroundColor: entry.colorHex }}
                    aria-hidden="true"
                />

                                <div className="routine-entry-info">
                                    <strong>{entry.time}</strong>
                                    <span>{entry.colorName}</span>
                                </div>

                                <button
                                    type="button"
                                    className="routine-entry-toggle"
                                    onClick={() => toggleEntry(entry.id)}
                                    aria-pressed={entry.enabled}
                                    aria-label={`${
                                        entry.enabled ? 'Disable' : 'Enable'
                                    } ${entry.colorName} at ${entry.time}`}
                                >
                                    {entry.enabled ? 'On' : 'Off'}
                                </button>

                                <button
                                    type="button"
                                    className="remove-button"
                                    onClick={() => removeEntry(entry.id)}
                                    aria-label={`Remove ${entry.colorName} at ${entry.time}`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="section">
                <h2>Add a color</h2>
                <p>Choose when and which color to activate.</p>

                <form
                    className="routine-form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        addEntry()
                    }}
                >
                    <label htmlFor="routine-time">Time</label>
                    <input
                        id="routine-time"
                        type="time"
                        value={time}
                        onChange={(event) => setTime(event.target.value)}
                        required
                    />

                    <label htmlFor="routine-color">Color</label>
                    <select
                        id="routine-color"
                        value={colorName}
                        onChange={(event) => setColorName(event.target.value)}
                    >
                        {COLORS.map((color) => (
                            <option key={color.name} value={color.name}>
                                {color.name}
                            </option>
                        ))}
                    </select>

                    <button type="submit" className="primary-button">
                        Add to routine
                    </button>
                </form>
            </section>
        </main>
    )
}

export default RoutinePage
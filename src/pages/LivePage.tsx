import { useState } from 'react'
import { Link } from 'react-router'
import { COLORS } from '../constants/colors'
import { Chameleon, MoodIcon } from '../components'
import { useAppState } from '../useAppState'
import { sendBluetoothCommand } from '../services/bluetooth'
import { logBluetooth } from '../services/bluetoothLog'

const COLOR_COMMANDS: Record<string, string | undefined> = {
    Cold: '1',
    Hungry: '2',
    Playful: '3',
    Sleepy: undefined,
}

function LivePage() {
    const {
        isOn,
        setIsOn,
        selectedColor,
        setSelectedColor,
        isConnected,
    } = useAppState()

    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    async function applyColor(color: (typeof COLORS)[number]) {
        if (!isConnected) {
            const description =
                'Cannot apply color: Chromaleont is not connected.'

            setError('Connect to Chromaleont before changing colors.')
            logBluetooth('error', description)
            return
        }

        const command = COLOR_COMMANDS[color.name]

        if (!command) {
            setError(
                `${color.name} is not supported by the current firmware.`,
            )
            logBluetooth(
                'error',
                `Cannot apply ${color.name}: no firmware command is configured.`,
            )
            return
        }

        setBusy(true)
        setError('')
        setMessage(`Applying ${color.name}…`)

        try {
            const response = await sendBluetoothCommand(
                getConnectedAddress(),
                command,
            )

            if (response !== `ACK:${command}`) {
                throw new Error(
                    `Unexpected response: "${response}". Expected "ACK:${command}".`,
                )
            }

            setSelectedColor(color)
            setIsOn(true)
            setMessage(`${color.name} applied successfully.`)
        } catch (err) {
            const description = getErrorMessage(err)
            setError(description)
            setMessage('')
            logBluetooth(
                'error',
                `Unable to apply ${color.name}: ${description}`,
            )
        } finally {
            setBusy(false)
        }
    }

    async function togglePower() {
        if (!isConnected) {
            setError('Connect to Chromaleont before changing its power.')
            return
        }

        setBusy(true)
        setError('')
        setMessage(isOn ? 'Turning Chromaleont off…' : 'Turning Chromaleont on…')

        try {
            const command = isOn
                ? '0'
                : COLOR_COMMANDS[selectedColor.name]

            if (!command) {
                throw new Error(
                    `${selectedColor.name} is not supported by the current firmware.`,
                )
            }

            const response = await sendBluetoothCommand(
                getConnectedAddress(),
                command,
            )

            if (response !== `ACK:${command}`) {
                throw new Error(
                    `Unexpected response: "${response}". Expected "ACK:${command}".`,
                )
            }

            setIsOn(!isOn)

            setMessage(
                isOn
                    ? 'Chromaleont is now off.'
                    : `${selectedColor.name} is now active.`,
            )
        } catch (err) {
            const description = getErrorMessage(err)
            setError(description)
            setMessage('')
            logBluetooth('error', `Power command failed: ${description}`)
        } finally {
            setBusy(false)
        }
    }

    return (
        <main className="page live-page">
            <header className="screen-header">
                <p>Good afternoon</p>
                <h1>Live</h1>
            </header>

            {!isConnected && (
                <div className="offline-banner">
                    <span className="bluetooth-icon" aria-hidden="true">
                        ᛒ
                    </span>

                    <p>
                        Chromaleont is out of reach. Reconnect to change colors.
                    </p>

                    <Link to="/settings">Connect</Link>
                </div>
            )}

            <section
                className={`robot-stage ${isOn ? 'is-on' : 'is-off'}`}
                aria-label="Chameleon preview"
                style={
                    {
                        '--mood-color': isOn
                            ? selectedColor.hex
                            : '#C9C4BC',
                    } as React.CSSProperties
                }
            >
                <div className="stage-orb" aria-hidden="true" />

                <div className="stage-labels">
                    <span>
                        <i />
                        {isOn ? selectedColor.name : 'Off'}
                    </span>

                    <span>
                        {isConnected ? 'Bluetooth connected' : 'Not synced'}
                    </span>
                </div>

                <div
                    className={`chameleon-wrap ${
                        isOn ? 'animate-lizard' : ''
                    }`}
                >
                    <Chameleon
                        color={selectedColor.hex}
                        colorName={selectedColor.name}
                        isOn={isOn}
                    />
                </div>

                <div className="stage-copy" aria-live="polite">
                    <h2>
                        {isOn
                            ? `Chromaleont is ${selectedColor.name.toLowerCase()}`
                            : 'Chromaleont is resting'}
                    </h2>

                    <p>
                        {isOn
                            ? description(selectedColor.name)
                            : 'Turn Chromaleont on to bring back the color'}
                    </p>
                </div>
            </section>

            <section className="power-card">
                <span
                    className="power-icon"
                    style={{
                        backgroundColor: isOn
                            ? selectedColor.hex
                            : '#ffeedd',
                        color: moodTextColor(selectedColor.name),
                    }}
                >
                    <PowerIcon />
                </span>

                <div className="power-copy">
                    <strong>Power</strong>
                    <span>
                        {isOn ? 'On · glowing now' : 'Off · color paused'}
                    </span>
                </div>

                <button
                    className={`switch large ${isOn ? 'checked' : ''}`}
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    aria-label="Chameleon power"
                    onClick={togglePower}
                    disabled={!isConnected || busy}
                >
                    <i />
                </button>
            </section>

            <section className="mood-section">
                <div className="section-heading">
                    <h2>Choose a color</h2>
                    <span>Tap to apply instantly</span>
                </div>

                <div
                    className="mood-grid"
                    role="radiogroup"
                    aria-label="Chameleon color"
                >
                    {COLORS.map((color) => {
                        const active =
                            selectedColor.name === color.name && isOn

                        const supported =
                            COLOR_COMMANDS[color.name] !== undefined

                        return (
                            <button
                                key={color.name}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                disabled={
                                    !isConnected || busy || !supported
                                }
                                className={`mood-option ${
                                    active ? 'selected' : ''
                                }`}
                                title={
                                    supported
                                        ? color.name
                                        : `${color.name} is not supported by the current firmware`
                                }
                                onClick={() => applyColor(color)}
                            >
                                <span
                                    className="mood-icon"
                                    style={{
                                        backgroundColor: color.hex,
                                        color: moodTextColor(color.name),
                                    }}
                                >
                                    <MoodIcon name={color.name} />
                                </span>

                                <strong>{color.name}</strong>

                                {!supported && (
                                    <small>Not supported</small>
                                )}

                                {active && (
                                    <span className="mood-check">✓</span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </section>

            {message && (
                <p className="settings-note" role="status">
                    {message}
                </p>
            )}

            {error && (
                <p className="settings-error" role="alert">
                    {error}
                </p>
            )}

            {busy && (
                <p className="settings-note">
                    Waiting for the Bluetooth module…
                </p>
            )}
        </main>
    )
}

function getConnectedAddress(): string {
    const address = localStorage.getItem('chromaleont-connected-address')

    if (!address) {
        throw new Error(
            'The Bluetooth device address is unavailable. Reconnect from Settings.',
        )
    }

    return address
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : String(error)
}

function description(name: string) {
    return (
        {
            Cold: 'Calm, cool and curled up',
            Sleepy: 'Dimmed glow, winding down',
            Hungry: 'Wide-eyed and asking for snacks',
            Playful: 'Bright, bouncy and ready to play',
        }[name] ?? ''
    )
}

function moodTextColor(name: string) {
    return name === 'Sleepy'
        ? '#fff'
        : name === 'Hungry'
            ? '#2b0603'
            : name === 'Cold'
                ? '#0b2a3a'
                : '#0d2b05'
}

function PowerIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2v10M6.3 5.8a8 8 0 1 0 11.4 0" />
        </svg>
    )
}

export default LivePage
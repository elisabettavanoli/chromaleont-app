import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { BluetoothSerial } from '@ascentio-it/capacitor-bluetooth-serial'
import { useAppState } from '../useAppState'
import { Chameleon } from '../components'
import {
    connectToDevice,
    disconnectFromDevice,
    getPairedDevices,
    pingDevice,
    type PairedDevice,
} from '../services/bluetooth'
import {
    clearBluetoothLogs,
    getBluetoothLogs,
    logBluetooth,
    subscribeToBluetoothLogs,
    type BluetoothLogEntry,
} from '../services/bluetoothLog'

const CONNECTED_ADDRESS_KEY = 'chromaleont-connected-address'

function SettingsPage() {
    const { isConnected, setIsConnected, isOn, selectedColor } =
        useAppState()

    const [connecting, setConnecting] = useState(false)
    const [devices, setDevices] = useState<PairedDevice[]>([])
    const [selectedAddress, setSelectedAddress] = useState('')
    const [connectedAddress, setConnectedAddress] = useState(
        () => localStorage.getItem(CONNECTED_ADDRESS_KEY) ?? '',
    )
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [testing, setTesting] = useState(false)
    const [logs, setLogs] = useState<BluetoothLogEntry[]>(() =>
        getBluetoothLogs(),
    )

    const isAndroid = Capacitor.getPlatform() === 'android'

    const refreshLogs = useCallback(() => {
        setLogs(getBluetoothLogs())
    }, [])

    useEffect(() => {
        return subscribeToBluetoothLogs(refreshLogs)
    }, [refreshLogs])

    async function loadDevices() {
        setError('')
        setMessage('')
        setConnecting(true)

        logBluetooth('info', 'Requesting paired Bluetooth devices.')

        try {
            await BluetoothSerial.enable()

            const permissionsGranted =
                await BluetoothSerial.checkBluetoothPermissions()

            if (!permissionsGranted) {
                throw new Error(
                    'Bluetooth permissions were not granted.',
                )
            }

            const result = await getPairedDevices()

            setDevices(result)

            if (result.length === 0) {
                setSelectedAddress('')
                setMessage(
                    'No paired Bluetooth devices found. Pair the Chromaleont module in Android settings first.',
                )
                logBluetooth('error', 'No paired Bluetooth devices found.')
                return
            }

            const savedAddress =
                localStorage.getItem(CONNECTED_ADDRESS_KEY) ?? ''

            const savedDevice = result.find(
                (device) => device.address === savedAddress,
            )

            const chromaleont = result.find((device) =>
                device.name.toLowerCase().includes('chromaleont'),
            )

            const preferredDevice =
                savedDevice ?? chromaleont ?? result[0]

            setSelectedAddress(preferredDevice.address)

            setMessage(
                `Found ${result.length} paired device(s).`,
            )

            logBluetooth(
                'success',
                `Found ${result.length} paired device(s). Selected: ${preferredDevice.name} (${preferredDevice.address}).`,
            )
        } catch (err) {
            const description = getErrorMessage(err)

            setError(description)
            setMessage('')

            logBluetooth(
                'error',
                `Unable to load paired devices: ${description}`,
            )
        } finally {
            setConnecting(false)
        }
    }

    async function toggleConnection() {
        const savedAddress =
            localStorage.getItem(CONNECTED_ADDRESS_KEY) ?? ''

        const address =
            connectedAddress || savedAddress || selectedAddress

        if (isConnected) {
            if (!address) {
                const description =
                    'Cannot disconnect: Bluetooth device address is unavailable.'

                setError(description)
                logBluetooth('error', description)
                return
            }

            setConnecting(true)
            setError('')
            setMessage('Disconnecting…')

            try {
                await disconnectFromDevice(address)

                localStorage.removeItem(CONNECTED_ADDRESS_KEY)

                setIsConnected(false)
                setConnectedAddress('')
                setMessage('Disconnected from Chromaleont.')

                logBluetooth(
                    'success',
                    `Disconnected from ${address}.`,
                )
            } catch (err) {
                const description = getErrorMessage(err)

                setError(`Disconnection failed: ${description}`)
                setMessage('')

                logBluetooth(
                    'error',
                    `Disconnection failed: ${description}`,
                )

                console.error('[Bluetooth] Disconnection failed:', err)
            } finally {
                setConnecting(false)
            }

            return
        }

        if (!selectedAddress) {
            const description =
                'Select a paired Bluetooth device before connecting.'

            setError(description)
            logBluetooth('error', description)
            return
        }

        setConnecting(true)
        setError('')
        setMessage('Connecting to the Bluetooth module…')

        try {
            await BluetoothSerial.enable()

            const permissionsGranted =
                await BluetoothSerial.checkBluetoothPermissions()

            if (!permissionsGranted) {
                throw new Error(
                    'Bluetooth permissions were not granted.',
                )
            }

            logBluetooth(
                'info',
                `Starting connection to ${selectedAddress}.`,
            )

            await connectToDevice(selectedAddress)

            localStorage.setItem(
                CONNECTED_ADDRESS_KEY,
                selectedAddress,
            )

            setConnectedAddress(selectedAddress)
            setIsConnected(true)

            setMessage(
                'Connected. Test communication before controlling the colors.',
            )

            logBluetooth(
                'success',
                `Connection established with ${selectedAddress}.`,
            )
        } catch (err) {
            const description = getErrorMessage(err)

            setIsConnected(false)
            setConnectedAddress('')
            localStorage.removeItem(CONNECTED_ADDRESS_KEY)

            setError(description)
            setMessage('')

            logBluetooth(
                'error',
                `Connection failed: ${description}`,
            )
        } finally {
            setConnecting(false)
        }
    }

    async function testConnection() {
        const address =
            connectedAddress ||
            localStorage.getItem(CONNECTED_ADDRESS_KEY) ||
            selectedAddress

        if (!address) {
            const description =
                'Bluetooth device address unavailable. Disconnect and reconnect from Settings.'

            setError(description)
            setMessage('')

            logBluetooth('error', description)
            return
        }

        setTesting(true)
        setError('')
        setMessage('Sending P and waiting for PONG…')

        logBluetooth(
            'info',
            `Starting communication test with ${address}.`,
        )

        try {
            const receivedPong = await pingDevice(address)

            if (!receivedPong) {
                throw new Error(
                    'No valid PONG response received. Check the firmware, Bluetooth connection and serial response handling.',
                )
            }

            localStorage.setItem(
                CONNECTED_ADDRESS_KEY,
                address,
            )

            setConnectedAddress(address)
            setSelectedAddress(address)
            setIsConnected(true)

            setMessage('Communication successful: received PONG.')

            logBluetooth(
                'success',
                `Communication test successful with ${address}: PONG received.`,
            )
        } catch (err) {
            const description = getErrorMessage(err)

            setError(description)
            setMessage('')

            logBluetooth(
                'error',
                `Communication test failed for ${address}: ${description}`,
            )
        } finally {
            setTesting(false)
            refreshLogs()
        }
    }

    function handleClearLogs() {
        clearBluetoothLogs()
        refreshLogs()
        setMessage('Bluetooth diagnostic logs cleared.')
        setError('')
    }

    function handleRefreshLogs() {
        refreshLogs()
        setMessage('Diagnostic logs refreshed.')
        setError('')
    }

    const activeAddress =
        connectedAddress ||
        localStorage.getItem(CONNECTED_ADDRESS_KEY) ||
        ''

    const displayedDevice = devices.find(
        (device) => device.address === activeAddress,
    )

    return (
        <main className="page settings-page">
            <header className="screen-header">
                <p>Device</p>
                <h1>Settings</h1>
            </header>

            {!isAndroid && (
                <p className="settings-note">
                    Bluetooth Classic is available only in the Android app.
                </p>
            )}

            <section
                className="connection-card"
                aria-label="Device connection"
            >
                <div className="connection-summary">
                    <div className="mini-stage">
                        <Chameleon
                            color={selectedColor.hex}
                            colorName={selectedColor.name}
                            isOn={isConnected && isOn}
                        />
                    </div>

                    <div
                        className="connection-text"
                        role="status"
                        aria-live="polite"
                    >
                        <strong>
                            <i
                                className={`connection-dot ${
                                    connecting
                                        ? 'connecting'
                                        : isConnected
                                            ? 'connected'
                                            : ''
                                }`}
                            />

                            {connecting
                                ? 'Connecting…'
                                : isConnected
                                    ? 'Connected'
                                    : 'Not connected'}
                        </strong>

                        <span>
                            {connecting
                                ? 'Communicating with the Bluetooth module'
                                : isConnected
                                    ? displayedDevice?.name ??
                                    activeAddress ??
                                    'Bluetooth module connected'
                                    : 'Pair Chromaleont with your tablet first'}
                        </span>
                    </div>
                </div>

                {!isConnected && (
                    <button
                        className="connect-button"
                        type="button"
                        onClick={loadDevices}
                        disabled={connecting || !isAndroid}
                    >
                        <BluetoothIcon />
                        {connecting
                            ? 'Searching…'
                            : 'Find paired devices'}
                    </button>
                )}

                {!isConnected && devices.length > 0 && (
                    <div className="bluetooth-device-picker">
                        <label htmlFor="bluetooth-device">
                            Bluetooth device
                        </label>

                        <select
                            id="bluetooth-device"
                            value={selectedAddress}
                            onChange={(event) =>
                                setSelectedAddress(event.target.value)
                            }
                            disabled={connecting}
                        >
                            {devices.map((device) => (
                                <option
                                    key={device.address}
                                    value={device.address}
                                >
                                    {device.name} ({device.address})
                                </option>
                            ))}
                        </select>

                        <button
                            className="connect-button"
                            type="button"
                            onClick={toggleConnection}
                            disabled={connecting || !selectedAddress}
                        >
                            <BluetoothIcon />
                            Connect to Chromaleont
                        </button>
                    </div>
                )}

                {isConnected && (
                    <>
                        <button
                            className="connect-button"
                            type="button"
                            onClick={testConnection}
                            disabled={testing || connecting}
                        >
                            {testing
                                ? 'Testing…'
                                : 'Test communication (PONG)'}
                        </button>

                        <button
                            className="connect-button disconnect"
                            type="button"
                            onClick={toggleConnection}
                            disabled={connecting || testing}
                        >
                            Disconnect
                        </button>
                    </>
                )}

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
            </section>

            <section className="about-device">
                <h2>About this device</h2>

                <dl>
                    <InfoRow label="Name" value="Chromaleont" />
                    <InfoRow label="Model" value="Chromaleont C1" />
                    <InfoRow
                        label="Firmware"
                        value="2.4.1 · Up to date"
                    />
                    <InfoRow
                        label="Battery"
                        value={
                            isConnected
                                ? 'Connected · Battery data unavailable'
                                : '—'
                        }
                    />
                    <InfoRow
                        label="Serial number"
                        value="CHL-24-08-1137"
                        mono
                    />
                </dl>

                <p className="settings-note">
                    Battery and firmware information are not currently
                    retrieved from the Bluetooth module.
                </p>
            </section>

            <section className="about-device bluetooth-debug">
                <div className="section-heading">
                    <div>
                        <h2>Bluetooth diagnostics</h2>
                        <p>
                            Connection attempts, commands, responses and errors.
                        </p>
                    </div>

                    <div className="diagnostic-actions">
                        <button
                            type="button"
                            onClick={handleRefreshLogs}
                        >
                            Refresh logs
                        </button>

                        <button
                            type="button"
                            onClick={handleClearLogs}
                        >
                            Clear logs
                        </button>
                    </div>
                </div>

                <div
                    className="bluetooth-log-list"
                    role="log"
                    aria-live="polite"
                    aria-label="Bluetooth diagnostic logs"
                >
                    {logs.length === 0 ? (
                        <p className="settings-note">
                            No logs yet. Try connecting to the Bluetooth module.
                        </p>
                    ) : (
                        [...logs].reverse().map((entry) => (
                            <div
                                className={`bluetooth-log-entry ${entry.level}`}
                                key={entry.id}
                            >
                                <div className="bluetooth-log-meta">
                                    <time>{entry.timestamp}</time>
                                    <span className="bluetooth-log-level">
                                        {entry.level.toUpperCase()}
                                    </span>
                                </div>

                                <p>{entry.message}</p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </main>
    )
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

function InfoRow({
                     label,
                     value,
                     mono = false,
                 }: {
    label: string
    value: React.ReactNode
    mono?: boolean
}) {
    return (
        <div className="info-row">
            <dt>{label}</dt>
            <dd className={mono ? 'mono' : ''}>{value}</dd>
        </div>
    )
}

function BluetoothIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 7 10 10-5 5V2l5 5L7 17" />
        </svg>
    )
}

export default SettingsPage
export type BluetoothLogLevel = 'info' | 'success' | 'error'

export interface BluetoothLogEntry {
    id: string
    timestamp: string
    level: BluetoothLogLevel
    message: string
}

const STORAGE_KEY = 'chromaleont-bluetooth-logs'
const EVENT_NAME = 'chromaleont-bluetooth-log'
const MAX_LOGS = 100

export function getBluetoothLogs(): BluetoothLogEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)

        if (!stored) return []

        const parsed: unknown = JSON.parse(stored)

        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export function logBluetooth(
    level: BluetoothLogLevel,
    message: string,
): void {
    const entry: BluetoothLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
    }

    const logs = [...getBluetoothLogs(), entry].slice(-MAX_LOGS)

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
    } catch {
        // The current session can still display logs if storage is unavailable.
    }

    console[level === 'error' ? 'error' : 'log'](
        `[Bluetooth] ${message}`,
    )

    window.dispatchEvent(new Event(EVENT_NAME))
}

export function clearBluetoothLogs(): void {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {
        // Ignore storage errors.
    }

    window.dispatchEvent(new Event(EVENT_NAME))
}

export function subscribeToBluetoothLogs(
    callback: () => void,
): () => void {
    window.addEventListener(EVENT_NAME, callback)

    return () => {
        window.removeEventListener(EVENT_NAME, callback)
    }
}
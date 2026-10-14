import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { BluetoothSerial } from '@ascentio-it/capacitor-bluetooth-serial'
import { logBluetooth } from './bluetoothLog'

export interface PairedDevice {
    name: string
    address: string
}

const RESPONSE_TIMEOUT_MS = 4000

let notificationListener: PluginListenerHandle | null = null
let notificationsAddress: string | null = null
let notificationsStarted = false

let pendingResponse:
    | {
    resolve: (value: string) => void
    reject: (error: Error) => void
    timeoutId: ReturnType<typeof setTimeout>
}
    | null = null

// Ensure only one command is waiting for a response at a time.
let commandQueue: Promise<void> = Promise.resolve()

export async function getPairedDevices(): Promise<PairedDevice[]> {
    logBluetooth('info', 'Checking Bluetooth platform and permissions.')

    if (Capacitor.getPlatform() !== 'android') {
        throw new Error(
            'Bluetooth Classic is available only in the Android app.',
        )
    }

    const permissionsGranted =
        await BluetoothSerial.checkBluetoothPermissions()

    if (!permissionsGranted) {
        throw new Error('Bluetooth permissions have not been granted.')
    }

    const bluetoothState = await BluetoothSerial.isEnabled()

    logBluetooth(
        'info',
        `Bluetooth enabled: ${bluetoothState.enabled}.`,
    )

    if (!bluetoothState.enabled) {
        throw new Error(
            'Bluetooth is disabled. Enable it on your tablet and try again.',
        )
    }

    const result = await BluetoothSerial.getPairedDevices()

    logBluetooth(
        'success',
        `Found ${result.devices.length} paired Bluetooth device(s).`,
    )

    result.devices.forEach((device) => {
        logBluetooth(
            'info',
            `Paired device: ${device.name} (${device.address}).`,
        )
    })

    return result.devices
}

export async function connectToDevice(address: string): Promise<void> {
    logBluetooth('info', `Connecting to ${address}.`)

    try {
        await BluetoothSerial.connect({ address })

        logBluetooth('success', `Connected to ${address}.`)

        await startResponseNotifications(address)

        logBluetooth(
            'success',
            `Bluetooth response notifications enabled for ${address}.`,
        )
    } catch (error) {
        logBluetooth(
            'error',
            `Connection or notification setup failed: ${getErrorMessage(error)}`,
        )

        // Avoid leaving a partially initialized connection behind.
        await cleanupNotifications(address)

        try {
            await BluetoothSerial.disconnect({ address })
        } catch {
            // The connection may already have been closed.
        }

        throw error
    }
}

export async function disconnectFromDevice(
    address: string,
): Promise<void> {
    logBluetooth('info', `Disconnecting from ${address}.`)

    await cleanupNotifications(address)

    try {
        await BluetoothSerial.disconnect({ address })

        logBluetooth('success', `Disconnected from ${address}.`)
    } catch (error) {
        logBluetooth(
            'error',
            `Disconnection failed: ${getErrorMessage(error)}`,
        )

        throw error
    }
}

export function sendBluetoothCommand(
    address: string,
    command: string,
): Promise<string> {
    const operation = commandQueue.then(() =>
        sendBluetoothCommandInternal(address, command),
    )

    // A failed command must not block all subsequent commands.
    commandQueue = operation.then(
        () => undefined,
        () => undefined,
    )

    return operation
}

async function sendBluetoothCommandInternal(
    address: string,
    command: string,
): Promise<string> {
    logBluetooth('info', `Sending command "${command}" to ${address}.`)

    try {
        await startResponseNotifications(address)

        const responsePromise = waitForResponse()

        try {
            await BluetoothSerial.write({
                address,
                value: command,
            })
        } catch (error) {
            cancelPendingResponse()

            throw error
        }

        const response = await responsePromise

        logBluetooth(
            'success',
            `Response to "${command}": "${response}".`,
        )

        return response
    } catch (error) {
        logBluetooth(
            'error',
            `Command "${command}" failed: ${getErrorMessage(error)}`,
        )

        throw error
    }
}

export async function pingDevice(address: string): Promise<boolean> {
    const response = await sendBluetoothCommand(address, 'P')

    const normalizedResponse = response
        .replace(/[\r\n\0]/g, '')
        .trim()
        .toUpperCase()

    const receivedPong = normalizedResponse === 'PONG'

    logBluetooth(
        receivedPong ? 'success' : 'error',
        `PONG test: received "${response}", normalized to "${normalizedResponse}".`,
    )

    return receivedPong
}

async function startResponseNotifications(
    address: string,
): Promise<void> {
    if (notificationsStarted && notificationsAddress === address) {
        return
    }

    if (notificationsStarted || notificationListener) {
        await cleanupNotifications(notificationsAddress ?? undefined)
    }

    // Register the listener before enabling notifications so that an
    // incoming response cannot be missed during setup.
    notificationListener = await BluetoothSerial.addListener(
        'onRead',
        (result) => {
            const rawValue = result.value

            const receivedBytes = Array.from(
                new TextEncoder().encode(rawValue),
            )
                .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
                .join(' ')

            logBluetooth(
                'info',
                `Bluetooth raw RX: text=${JSON.stringify(rawValue)}, bytes=[${receivedBytes}]`,
            )

            const response = rawValue
                .replace(/[\r\n\0]/g, '')
                .trim()

            if (!response) {
                return
            }

            logBluetooth(
                'info',
                `Bluetooth data received: "${response}".`,
            )

            if (!pendingResponse) {
                logBluetooth(
                    'info',
                    `No command is waiting for this response: "${response}".`,
                )

                return
            }

            const pending = pendingResponse

            pendingResponse = null
            clearTimeout(pending.timeoutId)

            pending.resolve(response)
        },
    )

    try {
        await BluetoothSerial.startNotifications({
            address,
            delimiter: '\n',
        })

        notificationsAddress = address
        notificationsStarted = true
    } catch (error) {
        await notificationListener.remove()
        notificationListener = null

        throw error
    }
}

function waitForResponse(): Promise<string> {
    if (pendingResponse) {
        return Promise.reject(
            new Error('Another Bluetooth response is already pending.'),
        )
    }

    return new Promise<string>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            pendingResponse = null

            logBluetooth(
                'error',
                `No Bluetooth response received within ${RESPONSE_TIMEOUT_MS / 1000} seconds.`,
            )

            reject(
                new Error(
                    `No Bluetooth response received within ${RESPONSE_TIMEOUT_MS / 1000} seconds.`,
                ),
            )
        }, RESPONSE_TIMEOUT_MS)

        pendingResponse = {
            resolve,
            reject,
            timeoutId,
        }
    })
}

function cancelPendingResponse(): void {
    if (!pendingResponse) {
        return
    }

    clearTimeout(pendingResponse.timeoutId)
    pendingResponse.reject(new Error('Bluetooth command was interrupted.'))
    pendingResponse = null
}

async function cleanupNotifications(
    address?: string,
): Promise<void> {
    if (
        address &&
        notificationsAddress &&
        address !== notificationsAddress
    ) {
        return
    }

    cancelPendingResponse()

    if (notificationsStarted && notificationsAddress) {
        try {
            await BluetoothSerial.stopNotifications({
                address: notificationsAddress,
            })
        } catch (error) {
            logBluetooth(
                'error',
                `Unable to stop Bluetooth notifications: ${getErrorMessage(error)}`,
            )
        }
    }

    if (notificationListener) {
        try {
            await notificationListener.remove()
        } catch (error) {
            logBluetooth(
                'error',
                `Unable to remove Bluetooth listener: ${getErrorMessage(error)}`,
            )
        }
    }

    notificationListener = null
    notificationsAddress = null
    notificationsStarted = false
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}
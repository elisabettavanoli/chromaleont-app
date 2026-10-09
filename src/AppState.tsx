import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { COLORS } from './constants/colors'
import { AppStateContext, type RoutineEntry } from './appStateContext'

const STORAGE_KEY = 'chromaleont-app-state'

const colorName = (name: string) =>
    COLORS.find((color) => color.name === name) ?? COLORS[0]

interface PersistedAppState {
    isOn: boolean
    selectedColorName: string
    routine: RoutineEntry[]
    routineEnabled: boolean
}

const defaultRoutine: RoutineEntry[] = [
    { id: 1, time: '07:00', colorName: 'Playful', enabled: true },
    { id: 2, time: '12:30', colorName: 'Hungry', enabled: true },
    { id: 3, time: '15:00', colorName: 'Cold', enabled: false },
    { id: 4, time: '21:30', colorName: 'Sleepy', enabled: true },
]

function loadPersistedState(): PersistedAppState | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)

        if (!stored) {
            return null
        }

        const parsed: unknown = JSON.parse(stored)

        if (
            typeof parsed !== 'object' ||
            parsed === null ||
            !('isOn' in parsed) ||
            typeof parsed.isOn !== 'boolean' ||
            !('selectedColorName' in parsed) ||
            typeof parsed.selectedColorName !== 'string' ||
            !('routineEnabled' in parsed) ||
            typeof parsed.routineEnabled !== 'boolean' ||
            !('routine' in parsed) ||
            !Array.isArray(parsed.routine)
        ) {
            return null
        }

        const validRoutine = parsed.routine.every(
            (entry: unknown) => {
                if (typeof entry !== 'object' || entry === null) {
                    return false
                }

                return (
                    'id' in entry &&
                    typeof entry.id === 'number' &&
                    'time' in entry &&
                    typeof entry.time === 'string' &&
                    /^\d{2}:\d{2}$/.test(entry.time) &&
                    'colorName' in entry &&
                    typeof entry.colorName === 'string' &&
                    COLORS.some((color) => color.name === entry.colorName) &&
                    'enabled' in entry &&
                    typeof entry.enabled === 'boolean'
                )
            },
        )

        if (!validRoutine) {
            return null
        }

        return {
            isOn: parsed.isOn,
            selectedColorName: parsed.selectedColorName,
            routine: parsed.routine as RoutineEntry[],
            routineEnabled: parsed.routineEnabled,
        }
    } catch {
        return null
    }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
    const [initialState] = useState(loadPersistedState)

    const [isOn, setIsOn] = useState(
        () => initialState?.isOn ?? true,
    )

    const [selectedColor, setSelectedColor] = useState(
        () => colorName(initialState?.selectedColorName ?? 'Playful'),
    )

    const [routine, setRoutineState] = useState<RoutineEntry[]>(
        () => initialState?.routine ?? defaultRoutine,
    )

    const [routineEnabled, setRoutineEnabled] = useState(
        () => initialState?.routineEnabled ?? true,
    )

    // The simulated connection always starts disconnected.
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        const stateToSave: PersistedAppState = {
            isOn,
            selectedColorName: selectedColor.name,
            routine,
            routineEnabled,
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
        } catch (error) {
            console.error('Unable to save Chromaleont state:', error)
        }
    }, [isOn, selectedColor, routine, routineEnabled])

    const value = useMemo(
        () => ({
            isOn,
            setIsOn,
            selectedColor,
            setSelectedColor,
            routine,
            setRoutine: (
                update: (current: RoutineEntry[]) => RoutineEntry[],
            ) => setRoutineState(update),
            routineEnabled,
            setRoutineEnabled,
            isConnected,
            setIsConnected,
        }),
        [isOn, selectedColor, routine, routineEnabled, isConnected],
    )

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    )
}
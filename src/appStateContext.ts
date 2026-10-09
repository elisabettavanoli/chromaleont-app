import { createContext } from 'react'
import type { ChameleonColor } from './constants/colors'

export interface RoutineEntry {
    id: number
    time: string
    colorName: string
    enabled: boolean
}

export interface AppStateValue {
    isOn: boolean
    setIsOn: (value: boolean) => void
    selectedColor: ChameleonColor
    setSelectedColor: (color: ChameleonColor) => void
    routine: RoutineEntry[]
    setRoutine: (update: (current: RoutineEntry[]) => RoutineEntry[]) => void
    routineEnabled: boolean
    setRoutineEnabled: (enabled: boolean) => void
    isConnected: boolean
    setIsConnected: (connected: boolean) => void
}

export const AppStateContext = createContext<AppStateValue | null>(null)

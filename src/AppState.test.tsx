import { beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AppStateProvider } from './AppState'
import { useAppState } from './useAppState'
import { COLORS } from './constants/colors'

function TestComponent() {
    const {
        isOn,
        setIsOn,
        selectedColor,
        setSelectedColor,
        routine,
        routineEnabled,
        setRoutineEnabled,
    } = useAppState()

    return (
        <div>
            <p data-testid="power">{String(isOn)}</p>
            <p data-testid="color">{selectedColor.name}</p>
            <p data-testid="routine-enabled">{String(routineEnabled)}</p>
            <p data-testid="routine-count">{routine.length}</p>

            <button onClick={() => setIsOn(false)}>Turn off</button>

            <button
                onClick={() => {
                    const coldColor = COLORS.find(
                        (color) => color.name === 'Cold',
                    )

                    if (coldColor) {
                        setSelectedColor(coldColor)
                    }
                }}
            >
                Select Cold
            </button>

            <button onClick={() => setRoutineEnabled(false)}>
                Disable routine
            </button>
        </div>
    )
}

function renderApp() {
    return render(
        <AppStateProvider>
            <TestComponent />
        </AppStateProvider>,
    )
}

describe('AppState persistence', () => {
    beforeEach(() => {
        cleanup()
        localStorage.clear()
    })

    it('initializes the app with the default state', () => {
        renderApp()

        expect(screen.getByTestId('power').textContent).toBe('true')
        expect(screen.getByTestId('color').textContent).toBe('Playful')
        expect(screen.getByTestId('routine-enabled').textContent).toBe('true')
        expect(screen.getByTestId('routine-count').textContent).toBe('4')
    })

    it('saves changes to localStorage', async () => {
        renderApp()

        fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
        fireEvent.click(screen.getByRole('button', { name: 'Select Cold' }))
        fireEvent.click(
            screen.getByRole('button', { name: 'Disable routine' }),
        )

        expect(screen.getByTestId('power').textContent).toBe('false')
        expect(screen.getByTestId('color').textContent).toBe('Cold')
        expect(screen.getByTestId('routine-enabled').textContent).toBe('false')

        const storedState = JSON.parse(
            localStorage.getItem('chromaleont-app-state')!,
        )

        expect(storedState.isOn).toBe(false)
        expect(storedState.selectedColorName).toBe('Cold')
        expect(storedState.routineEnabled).toBe(false)
    })

    it('restores the saved state when the app is mounted again', () => {
        const firstRender = renderApp()

        fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
        fireEvent.click(screen.getByRole('button', { name: 'Select Cold' }))

        firstRender.unmount()

        renderApp()

        expect(screen.getByTestId('power').textContent).toBe('false')
        expect(screen.getByTestId('color').textContent).toBe('Cold')
    })
})
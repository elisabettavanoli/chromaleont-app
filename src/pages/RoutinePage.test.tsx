import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { AppStateProvider } from '../AppState'
import RoutinePage from './RoutinePage'

function renderRoutinePage() {
    return render(
        <AppStateProvider>
            <RoutinePage />
        </AppStateProvider>,
    )
}

describe('RoutinePage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it('displays the default routine entries', () => {
        renderRoutinePage()

        expect(screen.getByText('7:00 AM')).toBeTruthy()
        expect(screen.getByText('12:30 PM')).toBeTruthy()
        expect(screen.getByText('3:00 PM')).toBeTruthy()
        expect(screen.getByText('9:30 PM')).toBeTruthy()
    })

    it('adds a new color change to the routine', () => {
        renderRoutinePage()

        fireEvent.change(screen.getByLabelText('Time'), {
            target: { value: '18:00' },
        })

        fireEvent.click(screen.getByRole('radio', { name: /Cold/i }))
        fireEvent.click(
            screen.getByRole('button', { name: /Add to routine/i }),
        )

        expect(screen.getByText('6:00 PM')).toBeTruthy()
        expect(screen.getByText('Turns Cold')).toBeTruthy()
    })

    it('removes a routine entry', () => {
        renderRoutinePage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Playful at 07:00',
            }),
        )

        expect(screen.queryByText('7:00 AM')).toBeNull()
        expect(screen.getByText('12:30 PM')).toBeTruthy()
    })

    it('toggles an individual routine entry', () => {
        renderRoutinePage()

        fireEvent.click(
            screen.getByRole('switch', {
                name: 'Disable Playful at 07:00',
            }),
        )

        expect(
            screen.getByRole('switch', {
                name: 'Enable Playful at 07:00',
            }),
        ).toBeTruthy()
    })

    it('toggles the entire routine without removing entries', () => {
        renderRoutinePage()

        fireEvent.click(
            screen.getByRole('switch', {
                name: 'Enable entire routine',
            }),
        )

        expect(screen.getByText('0 of 4 changes active')).toBeTruthy()
        expect(screen.getByText('7:00 AM')).toBeTruthy()
        expect(screen.getByText('12:30 PM')).toBeTruthy()
    })

    it('edits the time and color of a routine entry', () => {
        renderRoutinePage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Edit Playful at 07:00',
            }),
        )

        const editButton = screen.getByRole('button', {
            name: 'Edit Playful at 07:00',
        })
        const row = editButton.closest('li')

        expect(row).not.toBeNull()

        const routineRow = within(row as HTMLElement)

        fireEvent.change(routineRow.getByLabelText('Time'), {
            target: { value: '08:30' },
        })

        fireEvent.change(routineRow.getByLabelText('Color'), {
            target: { value: 'Cold' },
        })

        expect(screen.getByText('8:30 AM')).toBeTruthy()
        expect(screen.getByText('Turns Cold')).toBeTruthy()
    })
})
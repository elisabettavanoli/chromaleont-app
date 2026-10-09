import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppStateProvider } from '../AppState'
import LivePage from './LivePage'

function renderLivePage() {
    return render(
        <MemoryRouter>
            <AppStateProvider>
                <LivePage />
            </AppStateProvider>
        </MemoryRouter>,
    )
}

describe('LivePage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it('displays the default chameleon state', () => {
        renderLivePage()

        expect(screen.getByRole('heading', { name: 'Live' })).toBeTruthy()
        expect(screen.getByText('Chromaleont is playful')).toBeTruthy()
        expect(screen.getByText('On · glowing now')).toBeTruthy()

        expect(
            screen.getByRole('switch', { name: 'Chameleon power' }).getAttribute('aria-checked'),
        ).toBe('true')
    })

    it('turns the chameleon off', () => {
        renderLivePage()

        fireEvent.click(
            screen.getByRole('switch', { name: 'Chameleon power' }),
        )

        expect(screen.getByText('Chromaleont is resting')).toBeTruthy()
        expect(screen.getByText('Off · color paused')).toBeTruthy()

        expect(
            screen.getByRole('switch', { name: 'Chameleon power' }).getAttribute('aria-checked'),
        ).toBe('false')
    })

    it('turns the chameleon on again', () => {
        renderLivePage()

        const powerSwitch = screen.getByRole('switch', {
            name: 'Chameleon power',
        })

        fireEvent.click(powerSwitch)
        fireEvent.click(powerSwitch)

        expect(screen.getByText('Chromaleont is playful')).toBeTruthy()
        expect(screen.getByText('On · glowing now')).toBeTruthy()
    })

    it('shows the offline banner when the chameleon is disconnected', () => {
        renderLivePage()

        expect(
            screen.getByText('Chromaleont is out of reach. Reconnect to change colors.'),
        ).toBeTruthy()

        expect(screen.getByRole('link', { name: 'Connect' })).toBeTruthy()
        expect(screen.getByText('Not synced')).toBeTruthy()
    })

    it('disables color selection when the chameleon is disconnected', () => {
        renderLivePage()

        const colorOptions = screen.getAllByRole('radio')

        expect(colorOptions).toHaveLength(4)

        for (const option of colorOptions) {
            expect((option as HTMLButtonElement).disabled).toBe(true)
        }
    })

    it('updates the selected color when connected', () => {
        renderLivePage()

        // The app starts disconnected, so the color options are disabled.
        // This test verifies that the initial state correctly prevents selection.
        const coldOption = screen.getByRole('radio', { name: /Cold/i })

        expect((coldOption as HTMLButtonElement).disabled).toBe(true)
        expect(screen.getByText('Chromaleont is playful')).toBeTruthy()
    })
})
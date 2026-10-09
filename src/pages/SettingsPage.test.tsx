import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AppStateProvider } from '../AppState'
import SettingsPage from './SettingsPage'

function renderSettingsPage() {
    return render(
        <AppStateProvider>
            <SettingsPage />
        </AppStateProvider>,
    )
}

describe('SettingsPage', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.useFakeTimers()
    })

    afterEach(() => {
        cleanup()
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
    })

    it('displays the initial disconnected state', () => {
        renderSettingsPage()

        expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy()
        expect(screen.getByText('Not connected')).toBeTruthy()
        expect(
            screen.getByRole('button', { name: 'Connect to Chromaleont' }),
        ).toBeTruthy()
        expect(screen.getByText('Keep Chromaleont within 10 m of your phone')).toBeTruthy()
    })

    it('displays the device information', () => {
        renderSettingsPage()

        expect(screen.getByText('Chromaleont C1')).toBeTruthy()
        expect(screen.getByText('2.4.1 · Up to date')).toBeTruthy()
        expect(screen.getByText('CHL-24-08-1137')).toBeTruthy()
        expect(screen.getByText('Bluetooth connection is simulated in this version.')).toBeTruthy()
    })

    it('shows the connecting state when the connect button is clicked', () => {
        renderSettingsPage()

        fireEvent.click(
            screen.getByRole('button', { name: 'Connect to Chromaleont' }),
        )

        expect(screen.getByText('Connecting…')).toBeTruthy()
        expect(screen.getByText('Looking for Chromaleont nearby')).toBeTruthy()
        expect(
            screen.getByRole('button', { name: 'Connecting to Chromaleont' }).hasAttribute('disabled'),
        ).toBe(true)
    })

    it('connects successfully after the simulated delay', () => {
        renderSettingsPage()

        fireEvent.click(
            screen.getByRole('button', { name: 'Connect to Chromaleont' }),
        )

        act(() => {
            vi.advanceTimersByTime(1100)
        })

        expect(screen.getByText('Connected')).toBeTruthy()
        expect(screen.getByText('Bluetooth · Strong signal')).toBeTruthy()
        expect(
            screen.getByRole('button', { name: 'Disconnect' }),
        ).toBeTruthy()
        expect(screen.getByText('82%')).toBeTruthy()
    })

    it('disconnects after clicking the disconnect button', () => {
        renderSettingsPage()

        fireEvent.click(
            screen.getByRole('button', { name: 'Connect to Chromaleont' }),
        )

        act(() => {
            vi.advanceTimersByTime(1100)
        })

        fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))

        expect(screen.getByText('Not connected')).toBeTruthy()
        expect(
            screen.getByRole('button', { name: 'Connect to Chromaleont' }),
        ).toBeTruthy()
        expect(screen.getByText('—')).toBeTruthy()
    })
})
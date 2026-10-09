import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router'
import LivePage from './pages/LivePage'
import RoutinePage from './pages/RoutinePage'
import SettingsPage from './pages/SettingsPage'
import { AppStateProvider } from './AppState'

function App() {
    return (
        <BrowserRouter>
            <AppStateProvider>
            <div className="app">
                <Routes>
                    <Route path="/" element={<Navigate to="/live" replace />} />
                    <Route path="/live" element={<LivePage />} />
                    <Route path="/routine" element={<RoutinePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>

                <nav className="bottom-nav" aria-label="Main navigation">
                    <NavLink to="/live">
                        <span className="nav-icon" aria-hidden="true"><Icon name="palette" /></span>
                        <span>Live</span>
                    </NavLink>

                    <NavLink to="/routine">
                        <span className="nav-icon" aria-hidden="true"><Icon name="calendar" /></span>
                        <span>Routine</span>
                    </NavLink>

                    <NavLink to="/settings">
                        <span className="nav-icon" aria-hidden="true"><Icon name="settings" /></span>
                        <span>Settings</span>
                    </NavLink>
                </nav>
            </div>
            </AppStateProvider>
        </BrowserRouter>
    )
}

export default App

function Icon({ name }: { name: 'palette' | 'calendar' | 'settings' }) {
    if (name === 'palette') return <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3c0-4.7-4-8.5-9-8.5Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/></svg>
    if (name === 'calendar') return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6"/></svg>
    return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z" transform="translate(-1 -1)"/></svg>
}

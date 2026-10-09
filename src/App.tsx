import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router'
import LivePage from './pages/LivePage'
import RoutinePage from './pages/RoutinePage'
import SettingsPage from './pages/SettingsPage'

function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <Routes>
                    <Route path="/" element={<Navigate to="/live" replace />} />
                    <Route path="/live" element={<LivePage />} />
                    <Route path="/routine" element={<RoutinePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>

                <nav className="bottom-nav" aria-label="Main navigation">
                    <NavLink to="/live">
                        <span aria-hidden="true">◉</span>
                        <span>Live</span>
                    </NavLink>

                    <NavLink to="/routine">
                        <span aria-hidden="true">◷</span>
                        <span>Routine</span>
                    </NavLink>

                    <NavLink to="/settings">
                        <span aria-hidden="true">⚙</span>
                        <span>Settings</span>
                    </NavLink>
                </nav>
            </div>
        </BrowserRouter>
    )
}

export default App
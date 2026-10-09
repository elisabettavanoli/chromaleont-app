import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
manifest: {
    name: 'Chromaleont',
    short_name: 'Chromaleont',
    description: 'A companion chameleon robot for everyday routines.',
    theme_color: '##82D7FF',
    background_color: '##FFFFFF',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [],
},
}),
],
})
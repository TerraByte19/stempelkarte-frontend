import { useState, useEffect } from 'react'

export function useInstallPrompt() {
    const [prompt, setPrompt] = useState(null)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Prüfen ob bereits installiert
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        // iOS erkennen
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
        setIsIOS(ios)

        // Android/Chrome Install-Prompt abfangen
        const handler = (e) => {
            e.preventDefault()
            setPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    async function install() {
        if (!prompt) return
        prompt.prompt()
        const { outcome } = await prompt.userChoice
        if (outcome === 'accepted') {
            setIsInstalled(true)
            setPrompt(null)
        }
    }

    return { prompt, install, isInstalled, isIOS }
}
import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallBanner() {
    const { prompt, install, isInstalled, isIOS } = useInstallPrompt()
    const [dismissed, setDismissed] = useState(
        () => localStorage.getItem('installDismissed') === 'true'
    )

    function dismiss() {
        localStorage.setItem('installDismissed', 'true')
        setDismissed(true)
    }

    // Nicht zeigen wenn: schon installiert, schon weggeklickt,
    // und kein Prompt verfügbar und kein iOS
    if (isInstalled || dismissed || (!prompt && !isIOS)) return null

    return (
        <div style={styles.banner}>
            <div style={styles.left}>
                <div style={styles.icon}>📲</div>
                <div>
                    <div style={styles.title}>App installieren</div>
                    <div style={styles.subtitle}>
                        {isIOS
                            ? 'Tippe auf Teilen → „Zum Home-Bildschirm"'
                            : 'Für schnelleren Zugriff auf dem Homescreen'}
                    </div>
                </div>
            </div>
            <div style={styles.right}>
                {!isIOS && (
                    <button style={styles.btnInstall} onClick={install}>
                        Installieren
                    </button>
                )}
                <button style={styles.btnDismiss} onClick={dismiss}>✕</button>
            </div>
        </div>
    )
}

const styles = {
    banner: {
        position: 'fixed', bottom: 80, left: 12, right: 12,
        background: '#3C3489', color: 'white', borderRadius: 14,
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        zIndex: 9999, gap: 12,
    },
    left: { display: 'flex', alignItems: 'center', gap: 12, flex: 1 },
    icon: { fontSize: 28, flexShrink: 0 },
    title: { fontSize: 14, fontWeight: 700 },
    subtitle: { fontSize: 12, opacity: 0.85, marginTop: 2 },
    right: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
    btnInstall: {
        background: 'white', color: '#3C3489', border: 'none',
        borderRadius: 8, padding: '7px 14px', fontSize: 13,
        fontWeight: 700, cursor: 'pointer',
    },
    btnDismiss: {
        background: 'rgba(255,255,255,0.2)', color: 'white',
        border: 'none', borderRadius: 8, padding: '7px 10px',
        fontSize: 13, cursor: 'pointer',
    },
}
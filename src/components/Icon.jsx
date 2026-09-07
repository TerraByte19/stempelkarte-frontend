// Schlichte Strich-Icons (statt Emojis). Farbe = currentColor, Groesse per prop.
const PATHS = {
  gift: <><rect x="3.5" y="9" width="17" height="11" rx="1.5" /><path d="M3.5 13h17M12 9v11" /><path d="M12 9C10 9 7.6 8.5 7.6 6.4 7.6 5.2 8.5 4.2 9.7 4.2c2 0 2.3 2.9 2.3 4.8Z" /><path d="M12 9c2 0 4.4-.5 4.4-2.6 0-1.2-.9-2.2-2.1-2.2-2 0-2.3 2.9-2.3 4.8Z" /></>,
  award: <><circle cx="12" cy="9" r="5.5" /><path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" /></>,
  check: <path d="M4.5 12.5 10 18 20 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  'check-circle': <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.8 2.8L16.5 9" /></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  camera: <><path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h1.5l1-2h5l1 2H20a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 18H5a1.5 1.5 0 0 1-1.5-1.5Z" /><circle cx="12" cy="12" r="3.4" /></>,
  warning: <><path d="M12 3.5 21 19.5H3Z" /><path d="M12 10v4.5M12 17.2v.1" /></>,
}

export default function Icon({ name, size = 22, strokeWidth = 1.7, style }) {
  const p = PATHS[name]
  if (!p) return null
  return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
           style={{ display: 'block', ...style }} aria-hidden="true">
        {p}
      </svg>
  )
}

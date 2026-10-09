export function MoodIcon({ name, size = 20 }: { name: string; size?: number }) {
    const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
    if (name === 'Cold') return <svg {...common}><path d="M12 2v20M4 6l16 12M20 6 4 18M8 3l4 3 4-3M8 21l4-3 4 3M3 10l4 2-1 4M21 10l-4 2 1 4"/></svg>
    if (name === 'Sleepy') return <svg {...common}><path d="M3 18h18M5 14a7 7 0 0 1 14 0M12 4v2M5.6 7l1.4 1.4M18.4 7 17 8.4"/></svg>
    if (name === 'Hungry') return <svg {...common}><path d="M4 3v7M7 3v7M4 7h3M5.5 10v11M16 3c-2 2-3 5-3 8h4v10M17 3v8"/></svg>
    return <svg {...common}><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></svg>
}

export function Chameleon({ color, colorName, isOn }: { color: string; colorName: string; isOn: boolean }) {
    const fill = isOn ? color : '#C9C4BC'
    const eyesClosed = !isOn || colorName === 'Sleepy'
    return <svg viewBox="0 0 240 190" className="chameleon-art" role="img" aria-label={`${isOn ? colorName : 'Resting'} chameleon illustration`}>
        <defs><linearGradient id="lizardShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".45"/><stop offset=".48" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".16"/></linearGradient><radialGradient id="lizardLed"><stop stopColor="#fff"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient></defs>
        <ellipse cx="128" cy="176" rx="74" ry="6" fill="#000" opacity=".08"/>
        <path d="M72 116C44 120 30 142 40 160c10 16 40 12 40-8 0-12-16-14-20-4" fill="none" stroke={fill} strokeWidth="16" strokeLinecap="round"/>
        <g fill={fill}><rect x="86" y="126" width="18" height="40" rx="9"/><rect x="144" y="126" width="18" height="40" rx="9"/><circle cx="96" cy="64" r="8"/><circle cx="114" cy="57" r="8"/><circle cx="133" cy="55" r="8"/><circle cx="152" cy="58" r="7"/><path d="M62 114c-2-38 36-60 76-58 28 2 46 12 56 26 20 4 30 18 26 32s-22 20-40 18c-18 10-40 12-62 12-32 0-52-8-56-30Z"/></g>
        <path d="M62 114c-2-38 36-60 76-58 28 2 46 12 56 26 20 4 30 18 26 32s-22 20-40 18c-18 10-40 12-62 12-32 0-52-8-56-30Z" fill="url(#lizardShade)"/>
        <path d="M112 70q-8 34 2 70" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="2"/><path d="m186 76-6-18" stroke="#2a2733" strokeWidth="3" strokeLinecap="round"/><circle cx="180" cy="56" r="5" fill={fill} stroke="#2a2733" strokeWidth="2.5"/>
        <circle cx="186" cy="96" r="18" fill={fill}/><circle cx="186" cy="96" r="18" fill="#000" opacity=".1"/>
        {eyesClosed ? <path d="M176 98q10 8 20 0" fill="none" stroke="#1d1a24" strokeWidth="3.5" strokeLinecap="round"/> : <><circle cx="186" cy="96" r="11.5" fill="#fff"/><circle cx={colorName === 'Hungry' ? 190 : 189} cy={colorName === 'Cold' ? 99 : 95} r={colorName === 'Hungry' ? 6.5 : 5.5} fill="#1d1a24"/><circle cx="191.5" cy="92.5" r="1.8" fill="#fff"/></>}
        {colorName === 'Hungry' && isOn ? <path d="M200 118q10 6 18-4" fill="#1d1a24" opacity=".75"/> : <path d="M200 118q10 2 17-5" fill="none" stroke="#1d1a24" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round"/>}
        {isOn && <><circle cx="132" cy="106" r="12" fill="url(#lizardLed)" opacity=".7"/><circle cx="132" cy="106" r="4.5" fill="#fff" opacity=".95"/></>}
    </svg>
}

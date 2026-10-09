export const COLORS = [
    { name: 'Cold', hex: '#82D7FF' },
    { name: 'Sleepy', hex: '#4600B4' },
    { name: 'Hungry', hex: '#FF3C28' },
    { name: 'Playful', hex: '#3CFF14' },
] as const

export type ChameleonColor = (typeof COLORS)[number]
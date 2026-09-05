// SVG path strings for growth phase keys
export const PHASE_ICONS: Record<string, string> = {
  // Зима / спокій
  'Спокій': '<path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07l14.14-14.14"/><circle cx="12" cy="12" r="2"/>',
  // Проростання
  'Проростання / Набрякання бруньок': '<path d="M12 22V12"/><path d="M12 12C12 12 7 10 7 5a5 5 0 0110 0c0 5-5 7-5 7z"/>',
  'Сходи': '<path d="M12 22V12"/><path d="M12 12C12 12 7 10 7 5a5 5 0 0110 0c0 5-5 7-5 7z"/>',
  // Кущення
  'Кущення': '<path d="M12 22V12"/><path d="M12 12C12 12 7 9 7 4a5 5 0 0110 0c0 5-5 8-5 8z"/><path d="M7 15C7 15 4 13 4 9"/><path d="M17 15C17 15 20 13 20 9"/>',
  // Вихід в трубку
  'Вихід в трубку': '<line x1="12" y1="22" x2="12" y2="2"/><path d="M8 6l4-4 4 4"/><path d="M9 14l-1 3"/><path d="M15 14l1 3"/>',
  // Колосіння
  'Колосіння': '<line x1="12" y1="22" x2="12" y2="8"/><path d="M8 8h8"/><path d="M9 5h6"/><path d="M10 11h4"/><path d="M10 14h4"/>',
  // Цвітіння
  'Цвітіння': '<circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M4.22 4.22l2.12 2.12"/><path d="M17.66 17.66l2.12 2.12"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="M4.22 19.78l2.12-2.12"/><path d="M17.66 6.34l2.12-2.12"/>',
  // Наливання зерна
  'Наливання зерна': '<circle cx="12" cy="12" r="8"/><path d="M12 8v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/>',
  // Дозрівання
  'Дозрівання': '<path d="M12 22V12"/><path d="M5 3a7 7 0 0014 0"/><path d="M8 8l-3 5"/><path d="M16 8l3 5"/>',
  // Збір урожаю
  'Збір урожаю': '<path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 21h18"/>',
  // Після збору
  'Після збору': '<path d="M17 8l-5-5-5 5"/><path d="M12 3v13"/><path d="M5 21h14"/><path d="M8 17l-3 4"/><path d="M16 17l3 4"/>',
}

// Fallback icon — generic leaf/plant
const FALLBACK = '<path d="M12 22V12"/><path d="M12 12C12 12 7 10 7 5a5 5 0 0110 0c0 5-5 7-5 7z"/>'

export function phaseIcon(key: string): string {
  return PHASE_ICONS[key] ?? FALLBACK
}

// Категорії порад (агрокалендар, поради за фенофазами): назва й іконка (SVG-вміст для viewBox 0 0 24 24)
export const TIP_CATEGORIES: Record<string, { label: string; svg: string }> = {
  pest:        { label: 'Шкідники',   svg: '<path d="M12 2a5 5 0 100 10A5 5 0 0012 2z"/><path d="M12 12v10"/><path d="M8 14l-4 2"/><path d="M16 14l4 2"/>' },
  disease:     { label: 'Хвороби',    svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  nutrition:   { label: 'Живлення',   svg: '<path d="M12 22V12"/><path d="M5 3a7 7 0 007 7 7 7 0 00-7-7"/><path d="M19 3a7 7 0 01-7 7 7 7 0 017-7"/>' },
  irrigation:  { label: 'Полив',      svg: '<path d="M20 16.2A4.5 4.5 0 0018 8h-1.26a8 8 0 10-12.62 8"/><line x1="8" y1="16" x2="8" y2="21"/><line x1="16" y1="16" x2="16" y2="21"/><line x1="12" y1="19" x2="12" y2="23"/>' },
  harvest:     { label: 'Збір',       svg: '<path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 21h18"/>' },
  preparation: { label: 'Підготовка', svg: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>' },
  pruning:     { label: 'Обрізка',    svg: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>' },
}

export const TIP_URGENCY_LABEL: Record<string, string> = { high: 'Важливо', medium: 'Рекомендовано', low: 'Опційно' }
export const TIP_URGENCY_BADGE: Record<string, string> = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-agro-hover text-agro',
}

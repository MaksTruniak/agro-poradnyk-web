export const TREATMENT_TYPES = [
  {
    value: 'захист',
    label: 'Захист',
    icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    bg: 'bg-blue-50',
    badge: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    value: 'підживлення',
    label: 'Підживлення',
    icon: '<path d="M12 22V12"/><path d="M5 3a7 7 0 0 0 7 7 7 7 0 0 0-7-7"/><path d="M19 3a7 7 0 0 1-7 7 7 7 0 0 1 7-7"/>',
    bg: 'bg-amber-50',
    badge: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  {
    value: 'обробка',
    label: 'Обробка',
    icon: '<path d="M9 3h6"/><path d="M10 3v5L5 17.5A1 1 0 006 19h12a1 1 0 00.87-1.5L14 8V3"/><line x1="8" y1="13" x2="16" y2="13"/>',
    bg: 'bg-green-50',
    badge: 'bg-green-50 border-green-200 text-green-700',
  },
  {
    value: 'полив',
    label: 'Полив',
    icon: '<path d="M20 16.2A4.5 4.5 0 0018 8h-1.26a8 8 0 10-12.62 8"/><line x1="8" y1="16" x2="8" y2="21"/><line x1="16" y1="16" x2="16" y2="21"/><line x1="12" y1="19" x2="12" y2="23"/>',
    bg: 'bg-sky-50',
    badge: 'bg-sky-50 border-sky-200 text-sky-700',
  },
  {
    value: 'інше',
    label: 'Інше',
    icon: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    bg: 'bg-gray-50',
    badge: 'bg-gray-50 border-gray-200 text-gray-600',
  },
]

export const TYPE_SVG: Record<string, string> = Object.fromEntries(TREATMENT_TYPES.map(t => [t.value, t.icon]))
export const TYPE_BG: Record<string, string> = Object.fromEntries(TREATMENT_TYPES.map(t => [t.value, t.bg]))
export const TYPE_BADGE: Record<string, string> = Object.fromEntries(TREATMENT_TYPES.map(t => [t.value, t.badge]))

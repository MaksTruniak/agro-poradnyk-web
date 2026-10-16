/**
 * Назва фази від моделі → ключ з довідника фенофаз (без урахування регістру й пунктуації).
 * Точний збіг; інакше найдовша назва зі списку, що входить у відповідь моделі (чи навпаки); не знайдено — як є.
 */
export function matchPhase(name: string, allowed: string[]) {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  const n = norm(name)
  if (!n) return name
  const exact = allowed.find(a => norm(a) === n)
  if (exact) return exact
  const partial = allowed
    .filter(a => norm(a) && (n.includes(norm(a)) || norm(a).includes(n)))
    .sort((a, b) => norm(b).length - norm(a).length)
  return partial[0] ?? name
}

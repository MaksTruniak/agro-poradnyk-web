// Перевірка запису з адмінки. База без прав не кидає помилку, а мовчки змінює 0 рядків —
// тому оновлення/вставки робимо з .select() і вважаємо порожню відповідь невдачею.
// Повертає true, якщо збережено; інакше показує повідомлення.
export function adminWriteOk(
  res: { data?: unknown; error?: { message: string } | null },
  what: string,
  { requireRows = true } = {},
): boolean {
  if (res.error) {
    useToast().error(`${what}: ${res.error.message}`)
    return false
  }
  const rows = Array.isArray(res.data) ? res.data.length : res.data ? 1 : 0
  if (requireRows && !rows) {
    useToast().error(`${what}: зміни не збережено (немає прав або запис не знайдено)`)
    return false
  }
  return true
}

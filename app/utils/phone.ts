// Маска телефону: +38 (0XX) XXX-XX-XX
export const formatPhone = (value: string) => {
  // Витягуємо тільки цифри
  let digits = value.replace(/\D/g, '')
  // Прибираємо префікс 38 якщо юзер вставив повний номер
  if (digits.startsWith('38')) digits = digits.slice(2)
  // Обмежуємо до 10 цифр (0XX XXX XX XX)
  digits = digits.slice(0, 10)
  if (!digits) return ''

  let masked = '+38 (' + digits.slice(0, 3)
  if (digits.length > 3) masked += ') ' + digits.slice(3, 6)
  if (digits.length > 6) masked += '-' + digits.slice(6, 8)
  if (digits.length > 8) masked += '-' + digits.slice(8, 10)
  return masked
}

export const isPhoneValid = (value: string) => /^\+38 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(value)

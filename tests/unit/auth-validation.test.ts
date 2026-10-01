import { describe, it, expect } from 'vitest'
import { formatPhone, isPhoneValid } from '../../app/utils/phone'
import { validatePassword } from '../../app/utils/password'

// --- Логіка з auth.vue ---

const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)


// --- Email ---

describe('Email валідація', () => {
  it('коректний email проходить', () => {
    expect(isEmailValid('user@example.com')).toBe(true)
    expect(isEmailValid('farmer.ivan@agro.ua')).toBe(true)
  })

  it('некоректний email не проходить', () => {
    expect(isEmailValid('notanemail')).toBe(false)
    expect(isEmailValid('missing@')).toBe(false)
    expect(isEmailValid('@nodomain.com')).toBe(false)
    expect(isEmailValid('no spaces @test.com')).toBe(false)
    expect(isEmailValid('')).toBe(false)
  })
})

// --- Телефон ---

describe('Телефон валідація', () => {
  it('правильно відформатований телефон проходить', () => {
    expect(isPhoneValid('+38 (067) 123-45-67')).toBe(true)
    expect(isPhoneValid('+38 (050) 999-88-77')).toBe(true)
  })

  it('неповний або неправильний телефон не проходить', () => {
    expect(isPhoneValid('+38 (067) 123-45')).toBe(false)
    expect(isPhoneValid('0671234567')).toBe(false)
    expect(isPhoneValid('')).toBe(false)
  })
})

describe('Маска телефону', () => {
  it('форматує цифри у маску', () => {
    expect(formatPhone('0671234567')).toBe('+38 (067) 123-45-67')
  })

  it('обробляє вставку повного номера з 380', () => {
    expect(formatPhone('380671234567')).toBe('+38 (067) 123-45-67')
  })

  it('обробляє вставку з +38', () => {
    expect(formatPhone('+380671234567')).toBe('+38 (067) 123-45-67')
  })

  it('обрізає зайві цифри', () => {
    expect(formatPhone('06712345678999')).toBe('+38 (067) 123-45-67')
  })

  it('порожній ввід повертає порожній рядок', () => {
    expect(formatPhone('')).toBe('')
  })
})

// --- Пароль ---

describe('Пароль валідація', () => {
  it('надійний пароль проходить', () => {
    expect(validatePassword('SecurePass1!')).toBeNull()
    expect(validatePassword('MyP@ssw0rd')).toBeNull()
  })

  it('занадто короткий пароль', () => {
    expect(validatePassword('Ab1!')).toBe('Пароль має бути не менше 8 символів')
  })

  it('без малої літери', () => {
    expect(validatePassword('SECURE1!')).toBe('Пароль має містити хоча б одну малу латинську літеру')
  })

  it('без великої літери', () => {
    expect(validatePassword('secure1!')).toBe('Пароль має містити хоча б одну велику латинську літеру')
  })

  it('без цифри', () => {
    expect(validatePassword('SecurePass!')).toBe('Пароль має містити хоча б одну цифру')
  })

  it('без спеціального символу', () => {
    expect(validatePassword('SecurePass1')).toBe('Пароль має містити хоча б один спеціальний символ')
  })
})

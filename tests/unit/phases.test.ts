import { describe, it, expect } from 'vitest'
import { matchPhase } from '../../server/utils/phases'

const allowed = ['Спокій', 'Цвітіння', 'Після цвітіння', 'Збір урожаю', "Початок достигання (м'якнення ягід)"]

describe('matchPhase', () => {
  it('точний збіг без урахування регістру', () => {
    expect(matchPhase('цвітіння', allowed)).toBe('Цвітіння')
    expect(matchPhase("початок достигання (м'якнення ягід)", allowed)).toBe("Початок достигання (м'якнення ягід)")
  })
  it('частковий збіг — найдовша назва', () => {
    expect(matchPhase('Після цвітіння (зав\'язь)', allowed)).toBe('Після цвітіння')
    expect(matchPhase('Збір', allowed)).toBe('Збір урожаю')
  })
  it('невідома фаза — як є', () => {
    expect(matchPhase('Кущення', allowed)).toBe('Кущення')
  })
})

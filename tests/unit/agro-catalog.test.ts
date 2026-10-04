import { describe, it, expect } from 'vitest'
import { normalizeName, findByName, findByIngredient, isGenericFertilizer, type CatalogProduct } from '../../server/utils/agroCatalog'

const p = (name: string, type: string, ingredients: string[] = [], kind: 'product' | 'fertilizer' = 'product'): CatalogProduct =>
  ({ id: name, name, slug: name, type, kind, norm: normalizeName(name), ingredients: ingredients.map(normalizeName) })

const catalog = {
  loadedAt: Date.now(),
  products: [
    p('Амістар Екстра', 'fungicide', ['Азоксистробін', 'Ципроконазол']),
    p('Амістар Голд', 'fungicide', ['Азоксистробін', 'Дифеноконазол']),
    p('Квадріс', 'fungicide', ['Азоксистробін']),
    p('Карате Зеон', 'insecticide', ['Лямбда-цигалотрин']),
    p('Раундап', 'herbicide', ['Гліфосат']),
    p('Т 12', 'herbicide', ['Гліфосат']),
    p('Jiva КАС 32', 'fertilizer', [], 'fertilizer'),
  ],
}

describe('normalizeName', () => {
  it('прибирає препаративні форми, концентрації й знаки', () => {
    expect(normalizeName('Амістар® Екстра 280 SC, к.с.')).toBe('амістар екстра')
    expect(normalizeName('«Карате Зеон» 050 CS')).toBe('карате зеон')
  })
})

describe('findByName', () => {
  it('точний і неточний збіг з назвою каталогу', () => {
    expect(findByName(catalog, 'Амістар Екстра')?.name).toBe('Амістар Екстра')
    expect(findByName(catalog, 'Амістар Екстра 280 SC')?.name).toBe('Амістар Екстра')
    expect(findByName(catalog, 'карате зеон 050 к.с.')?.name).toBe('Карате Зеон')
  })
  it('вигадана назва не збігається з каталогом', () => {
    expect(findByName(catalog, 'Фунгістоп Ультра')).toBeNull()
    expect(findByName(catalog, 'Амістар')).toBeNull()  // неповна назва — не вгадуємо між Екстра і Голд
  })
})

describe('findByIngredient', () => {
  it('аналог з тією самою комбінацією діючих речовин', () => {
    expect(findByIngredient(catalog, 'азоксистробін + ципроконазол', 'фунгіцид')?.name).toBe('Амістар Екстра')
  })
  it('для однієї речовини — препарат без зайвих компонентів', () => {
    expect(findByIngredient(catalog, 'азоксистробін', 'фунгіцид')?.name).toBe('Квадріс')
  })
  it('враховує клас препарату й відмінки', () => {
    expect(findByIngredient(catalog, 'гліфосату', 'гербіцид суцільної дії')?.name).toBe('Раундап')
    expect(findByIngredient(catalog, 'гліфосат', 'фунгіцид')).toBeNull()
  })
  it('не пропонує малоінформативних назв («Т 12»)', () => {
    expect(findByIngredient(catalog, 'гліфосат', 'гербіцид')?.name).toBe('Раундап')
  })
  it('невідома речовина — нічого', () => {
    expect(findByIngredient(catalog, 'вигаданоцин', 'фунгіцид')).toBeNull()
  })
})

describe('isGenericFertilizer', () => {
  it('загальні назви добрив', () => {
    expect(isGenericFertilizer('Сечовина')).toBe(true)
    expect(isGenericFertilizer('КАС-32')).toBe(true)
    expect(isGenericFertilizer('Аміачна селітра 34,4%')).toBe(true)
    expect(isGenericFertilizer('Аммофос')).toBe(true)
    expect(isGenericFertilizer('Амістар Екстра')).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { extractMentions, productForMention, uniqueProducts } from '../../shared/utils/aiProducts'
import { normalizeName, matchMentions, findByName, findByIngredient, isGenericFertilizer, isFieldOperation, type CatalogProduct } from '../../server/utils/agroCatalog'

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

describe('isFieldOperation', () => {
  it('полив, мульча, ручні роботи — не препарати', () => {
    expect(isFieldOperation('полив', 'Вода (крапельне зрошення)')).toBe(true)
    expect(isFieldOperation('обробка', 'Мульча з соснової кори')).toBe(true)
    expect(isFieldOperation('обробка', 'Ручне видалення квіток')).toBe(true)
    expect(isFieldOperation('обробка', "Підв'язка лози")).toBe(true)
  })
  it('препарати лишаються препаратами', () => {
    expect(isFieldOperation('захист', 'Хорус')).toBe(false)
    expect(isFieldOperation('підживлення', 'Монокалійфосфат')).toBe(false)
    // назва схожа на операцію, але є діюча речовина — це препарат
    expect(isFieldOperation('обробка', 'Мульча-гербіцид', 'пендиметалін')).toBe(false)
  })
  it('монокалійфосфат і сірка — загальні добрива', () => {
    expect(isGenericFertilizer('Монокалійфосфат')).toBe(true)
    expect(isGenericFertilizer('Сірка гранульована')).toBe(true)
  })
})

describe('@препарати у відповіді чату', () => {
  const text = 'Обробіть @Амістар Екстра 280 SC проти плямистості, через 10 днів — @Децисом. '
    + 'Після @Раундапу зачекайте. @Карате Зеоном від тлі; @Фітохвіст Супер — новинка. Підживіть @КАС-32.\n'
    + 'SCHEME_DETECTED\nREMINDER:Повторна обробка @Децис|10'

  it('витягує назви з кількох слів, з цифрами, без маркерів', () => {
    const m = extractMentions(text)
    expect(m[0]).toBe('Амістар Екстра 280 SC')
    expect(m).toContain('Децисом')
    expect(m).toContain('КАС-32')
    expect(m).toContain('Децис')
    expect(m.join(' ')).not.toMatch(/SCHEME|REMINDER/)
  })

  it('звіряє з каталогом з урахуванням відмінків', () => {
    const cat = { ...catalog, products: [...catalog.products, p('Децис', 'insecticide', ['Дельтаметрин'])] }
    const found = matchMentions(cat, text)
    const by = (mention: string) => found.find(x => x.mention === mention)
    expect(by('Амістар Екстра 280 SC')).toMatchObject({ name: 'Амістар Екстра', found: true })
    expect(by('Децисом')).toMatchObject({ name: 'Децис', found: true })
    expect(by('Раундапу')).toMatchObject({ name: 'Раундап', found: true })
    expect(by('Карате Зеоном')).toMatchObject({ name: 'Карате Зеон', found: true })
    expect(by('Фітохвіст Супер')).toMatchObject({ found: false })
    expect(by('КАС-32')).toMatchObject({ found: false, generic: true })
    // Децис і Децисом — один препарат
    const unique = uniqueProducts(found)
    expect(unique.filter(x => x.name === 'Децис')).toHaveLength(1)
    expect(unique.filter(x => !x.found && !x.generic).map(x => x.name)).toEqual(['Фітохвіст Супер'])
  })

  it('назва займає лише свої слова, решта — звичайний текст', () => {
    const found = matchMentions(catalog, 'Візьміть @Раундап проти бурʼянів')
    expect(found[0]).toMatchObject({ mention: 'Раундап', found: true })
    expect(productForMention('Раундап проти бурʼянів', found)?.name).toBe('Раундап')
    expect(matchMentions(catalog, '@Хомус для винограду')[0]).toMatchObject({ mention: 'Хомус', found: false })
    expect(matchMentions(catalog, '@Квадрисом')[0]).toMatchObject({ name: 'Квадріс', found: true })
  })
})

import { describe, it, expect } from 'vitest'
import { cropToSlug, slugToCrop, cropEmoji, CROP_SLUGS } from '../../app/utils/cropSlugs'
import { pluralFarm, pluralCrop, pluralFarmer } from '../../app/utils/plural'

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' })

const totalHa = (farms: { hectares: string | number }[]) =>
  farms.reduce((s, f) => s + (parseFloat(String(f.hectares)) || 0), 0)
    .toFixed(1).replace(/\.0$/, '')

const deduplicateCrops = (farms: { farm_crops: { crop_type: string; variety?: string; area_ha?: number }[] }[]) => {
  const seen = new Set<string>()
  const result: any[] = []
  for (const farm of farms) {
    for (const c of (farm.farm_crops || [])) {
      const key = `${c.crop_type}|${c.variety || ''}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push(c)
      }
    }
  }
  return result.sort((a, b) => (b.area_ha || 0) - (a.area_ha || 0))
}

// --- cropToSlug ---

describe('cropToSlug', () => {
  it('повертає правильний slug для відомих культур', () => {
    expect(cropToSlug('Кукурудза')).toBe('corn')
    expect(cropToSlug('Соняшник')).toBe('sunflower')
    expect(cropToSlug('Пшениця')).toBe('wheat')
    expect(cropToSlug('Соя')).toBe('soybean')
    expect(cropToSlug('Ріпак')).toBe('rapeseed')
  })

  it('повертає slug для культур з уточненням (озима/яра)', () => {
    expect(cropToSlug('Пшениця озима')).toBe('winter-wheat')
    expect(cropToSlug('Пшениця яра')).toBe('spring-wheat')
    expect(cropToSlug('Ріпак озимий')).toBe('winter-rapeseed')
    expect(cropToSlug('Ячмінь ярий')).toBe('spring-barley')
  })

  it('для невідомої культури робить транслітерацію через toLowerCase + дефіс', () => {
    expect(cropToSlug('Нова Культура')).toBe('нова культура'.replace(/\s+/g, '-'))
  })

  it('всі записи в CROP_SLUGS мають непорожній slug', () => {
    for (const [crop, slug] of Object.entries(CROP_SLUGS)) {
      expect(slug.length).toBeGreaterThan(0)
      expect(slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

// --- slugToCrop ---

describe('slugToCrop', () => {
  it('повертає назву культури по slug', () => {
    expect(slugToCrop('corn')).toBe('Кукурудза')
    expect(slugToCrop('sunflower')).toBe('Соняшник')
    expect(slugToCrop('potato')).toBe('Картопля')
    expect(slugToCrop('strawberry')).toBe('Полуниця')
  })

  it('для невідомого slug повертає сам slug', () => {
    expect(slugToCrop('unknown-crop')).toBe('unknown-crop')
  })

  it('зворотній маппінг: slug → cropToSlug(slugToCrop(slug)) === slug', () => {
    const unambiguousSlugs = ['corn', 'sunflower', 'soybean', 'potato', 'strawberry', 'buckwheat']
    for (const slug of unambiguousSlugs) {
      expect(cropToSlug(slugToCrop(slug))).toBe(slug)
    }
  })
})

// --- cropEmoji ---

describe('cropEmoji', () => {
  it('повертає правильне emoji для відомих культур', () => {
    expect(cropEmoji('Кукурудза')).toBe('🌽')
    expect(cropEmoji('Соняшник')).toBe('🌻')
    expect(cropEmoji('Картопля')).toBe('🥔')
    expect(cropEmoji('Томати')).toBe('🍅')
    expect(cropEmoji('Полуниця')).toBe('🍓')
    expect(cropEmoji('Виноград')).toBe('🍇')
  })

  it('повертає 🌱 для невідомої культури', () => {
    expect(cropEmoji('Невідома культура')).toBe('🌱')
    expect(cropEmoji('')).toBe('🌱')
  })
})

// --- Плюралізація ---

describe('pluralFarm', () => {
  it('1 поле', () => expect(pluralFarm(1)).toBe('поле'))
  it('2 поля', () => expect(pluralFarm(2)).toBe('поля'))
  it('4 поля', () => expect(pluralFarm(4)).toBe('поля'))
  it('5 полів', () => expect(pluralFarm(5)).toBe('полів'))
  it('11 полів', () => expect(pluralFarm(11)).toBe('полів'))
  it('21 поле', () => expect(pluralFarm(21)).toBe('поле'))
})

describe('pluralCrop', () => {
  it('1 культура', () => expect(pluralCrop(1)).toBe('культура'))
  it('3 культури', () => expect(pluralCrop(3)).toBe('культури'))
  it('7 культур', () => expect(pluralCrop(7)).toBe('культур'))
})

describe('pluralFarmer', () => {
  it('1 → фермер', () => expect(pluralFarmer(1)).toBe('фермер'))
  it('2 → фермери', () => expect(pluralFarmer(2)).toBe('фермери'))
  it('4 → фермери', () => expect(pluralFarmer(4)).toBe('фермери'))
  it('5 → фермерів', () => expect(pluralFarmer(5)).toBe('фермерів'))
  it('11 → фермерів', () => expect(pluralFarmer(11)).toBe('фермерів'))
  it('21 → фермер', () => expect(pluralFarmer(21)).toBe('фермер'))
  it('22 → фермери', () => expect(pluralFarmer(22)).toBe('фермери'))
})

// --- totalHa ---

describe('totalHa', () => {
  it('підсумовує гектари по полях', () => {
    const farms = [{ hectares: '100.5' }, { hectares: '50' }, { hectares: '25.5' }]
    expect(totalHa(farms)).toBe('176')
  })

  it('ігнорує некоректні значення', () => {
    const farms = [{ hectares: '100' }, { hectares: '' }, { hectares: 'abc' }]
    expect(totalHa(farms)).toBe('100')
  })

  it('повертає ціле число без .0', () => {
    expect(totalHa([{ hectares: '50' }, { hectares: '50' }])).toBe('100')
  })

  it('повертає десятковий дріб якщо є', () => {
    expect(totalHa([{ hectares: '10.5' }, { hectares: '5.3' }])).toBe('15.8')
  })

  it('порожній масив повертає 0', () => {
    expect(totalHa([])).toBe('0')
  })
})

// --- Дедублікація культур ---

describe('deduplicateCrops', () => {
  it('видаляє дублікати однієї культури з різних полів', () => {
    const farms = [
      { farm_crops: [{ crop_type: 'Кукурудза', area_ha: 50 }] },
      { farm_crops: [{ crop_type: 'Кукурудза', area_ha: 30 }] },
    ]
    expect(deduplicateCrops(farms)).toHaveLength(1)
    expect(deduplicateCrops(farms)[0].crop_type).toBe('Кукурудза')
  })

  it('різні сорти однієї культури не дедублікуються', () => {
    const farms = [
      { farm_crops: [{ crop_type: 'Пшениця', variety: 'Смуглянка', area_ha: 100 }] },
      { farm_crops: [{ crop_type: 'Пшениця', variety: 'Богдана', area_ha: 80 }] },
    ]
    expect(deduplicateCrops(farms)).toHaveLength(2)
  })

  it('культури без сорту і з сортом розрізняються', () => {
    const farms = [
      { farm_crops: [{ crop_type: 'Соняшник', area_ha: 200 }] },
      { farm_crops: [{ crop_type: 'Соняшник', variety: 'Лакомка', area_ha: 100 }] },
    ]
    expect(deduplicateCrops(farms)).toHaveLength(2)
  })

  it('сортує по area_ha за спаданням', () => {
    const farms = [
      {
        farm_crops: [
          { crop_type: 'Соя', area_ha: 50 },
          { crop_type: 'Кукурудза', area_ha: 200 },
          { crop_type: 'Ріпак', area_ha: 100 },
        ]
      },
    ]
    const result = deduplicateCrops(farms)
    expect(result[0].crop_type).toBe('Кукурудза')
    expect(result[1].crop_type).toBe('Ріпак')
    expect(result[2].crop_type).toBe('Соя')
  })

  it('порожні поля повертають порожній масив', () => {
    expect(deduplicateCrops([])).toHaveLength(0)
    expect(deduplicateCrops([{ farm_crops: [] }])).toHaveLength(0)
  })
})

// --- formatDate ---

describe('formatDate', () => {
  it('форматує дату у вигляді "місяць рік" українською', () => {
    const result = formatDate('2024-03-15T00:00:00Z')
    expect(result).toContain('2024')
    expect(result).toMatch(/березень|березня/i)
  })

  it('повертає рядок для коректної дати', () => {
    expect(typeof formatDate('2023-01-01')).toBe('string')
    expect(formatDate('2023-01-01').length).toBeGreaterThan(0)
  })
})

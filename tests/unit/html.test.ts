import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../../shared/utils/html'
import { buildInvoiceHtml, manualSaleInvoiceData, dealInvoiceData, parseDealMessage } from '../../shared/utils/invoice'

const XSS = '<img src=x onerror="alert(1)">'

describe('escapeHtml', () => {
  it('екранує HTML-символи', () => {
    expect(escapeHtml(XSS)).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    expect(escapeHtml(`a & b 'c'`)).toBe('a &amp; b &#39;c&#39;')
  })
  it('null / undefined / числа', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(5)).toBe('5')
  })
})

describe('накладна', () => {
  it('екранує дані контрагента й примітку', () => {
    const html = buildInvoiceHtml(manualSaleInvoiceData(
      { id: 'abcdef1234', crop_type: XSS, quantity_tons: 1, price_per_ton: 100, total_price: 100, notes: XSS, buyer_name: XSS },
      { name: XSS, company_name: XSS, edrpou: '1', iban: 'UA1' },
    ))
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })
  it('бере одиниці й кількість з повідомлення угоди', () => {
    expect(parseDealMessage('[deal:abc:кг:500:7]')).toEqual({ unit: 'кг', displayQty: 500, displayPrice: 7 })
    const d = dealInvoiceData({ id: 'abcdef1234', crop_type: 'Пропозиція продажу: Пшениця', quantity_tons: 0.5, price_per_ton: 7000, total_price: 3500 }, {}, {}, '[deal:abc:кг:500:7]')
    expect(d.itemName).toBe('Пшениця')
    expect(d.qty).toBe('500 кг')
    expect(d.invoiceNum).toBe('ABCDEF12')
  })
})

/**
 * Міграція даних з AgroAPI → Supabase
 * Запуск: node scripts/migrate-agro-api.mjs
 * Потрібен: SUPABASE_SERVICE_KEY=... node scripts/migrate-agro-api.mjs
 */

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const API_BASE = 'https://agro-api-production-1e91.up.railway.app'
const API_KEY = 'agp_live_c1d866d8c557d5df57953afeb8f98e88b5f74d69baa4cbcd261c4c75c02e67b3'
const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Потрібен SUPABASE_SERVICE_KEY')
  console.error('   Supabase → Settings → API → service_role key')
  console.error('   Запуск: SUPABASE_SERVICE_KEY=eyJ... node scripts/migrate-agro-api.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws },
})
const apiFetch = (path) =>
  fetch(`${API_BASE}${path}`, { headers: { 'Authorization': `Bearer ${API_KEY}` } }).then(r => r.json())

async function fetchAll(path) {
  const results = []
  let page = 1
  while (true) {
    const data = await apiFetch(`${path}?limit=100&page=${page}`)
    const items = data.items || data.data || []
    results.push(...items)
    process.stdout.write(`\r  ${path} — ${results.length}/${data.meta?.total || data.total || '?'}   `)
    if (items.length < 100) break
    page++
  }
  console.log()
  return results
}

async function fetchAllOffset(path) {
  const results = []
  let offset = 0
  while (true) {
    const data = await apiFetch(`${path}?limit=100&offset=${offset}`)
    const items = data.items || []
    results.push(...items)
    process.stdout.write(`\r  ${path} — ${results.length}/${data.total || '?'}   `)
    if (items.length < 100) break
    offset += 100
  }
  console.log()
  return results
}

const CONFLICT_COLS = {
  agro_product_ingredients: 'product_id,ingredient_id',
}

async function upsert(table, rows, chunkSize = 500) {
  const onConflict = CONFLICT_COLS[table] || 'id'
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict })
    if (error) {
      console.error(`\n❌ ${table} помилка:`, error.message)
      throw error
    }
    process.stdout.write(`\r  ✅ ${table}: ${i + chunk.length}/${rows.length}   `)
  }
  console.log()
}

async function main() {
  console.log('\n🚀 Починаємо міграцію AgroAPI → Supabase\n')

  // 1. Виробники
  console.log('📦 Виробники...')
  const mfData = await apiFetch('/v1/manufacturers')
  const manufacturers = mfData.items || []
  console.log(`  Знайдено: ${manufacturers.length}`)
  await upsert('agro_manufacturers', manufacturers.map(m => ({
    id: m.id, name: m.name, slug: m.slug,
    website_url: m.website_url || null,
    country: m.country || null,
    is_active: m.is_active ?? true,
  })))

  const mfMap = new Map(manufacturers.map(m => [m.slug, m.id]))

  // 2. Діючі речовини
  console.log('🧪 Діючі речовини...')
  const ingredients = await fetchAllOffset('/v1/active-ingredients')
  // Дедуплікуємо по slug перед вставкою
  const seenSlugs = new Set()
  const uniqueIngredients = ingredients.filter(i => {
    if (seenSlugs.has(i.slug)) return false
    seenSlugs.add(i.slug)
    return true
  })
  await upsert('agro_active_ingredients', uniqueIngredients.map(i => ({
    id: i.id, name: i.name, slug: i.slug,
    description: i.description || null,
  })))

  // 3. Препарати (список)
  console.log('🌿 Препарати...')
  const products = await fetchAll('/v1/products')
  await upsert('agro_products', products.map(p => ({
    id: p.id, name: p.name, slug: p.slug, type: p.type,
    source_image_url: p.source_image_url || null,
    market_segment: p.market_segment || null,
    seed_crop: p.seed_crop || null,
    seed_maturity_group: p.seed_maturity_group || null,
    seed_yield_potential: p.seed_yield_potential ? parseFloat(p.seed_yield_potential) : null,
    seed_recommended_zone: p.seed_recommended_zone || null,
    manufacturer_id: mfMap.get(p.manufacturer?.slug) || null,
    manufacturer_slug: p.manufacturer?.slug || null,
    formulation_code: p.formulation_type?.code || null,
    formulation_name: p.formulation_type?.name || null,
  })))

  // 4. Деталі препаратів
  console.log('📋 Деталі препаратів (це займе кілька хвилин)...')
  const productDetails = []
  const productIngredients = []
  let done = 0

  for (const p of products) {
    try {
      const data = await apiFetch(`/v1/products/${p.slug}`)
      const d = data.product || data
      if (d?.id) {
        productDetails.push({
          id: d.id,
          description: d.description || null,
          source_url: d.source_url || null,
          content_sections: d.content_sections?.length ? d.content_sections : null,
        })
        for (const ai of (d.active_ingredients || [])) {
          productIngredients.push({
            product_id: d.id,
            ingredient_id: ai.id,
            concentration: ai.concentration || null,
          })
        }
      }
    } catch {}
    done++
    if (done % 50 === 0) process.stdout.write(`\r  деталі: ${done}/${products.length}   `)
  }
  console.log(`\n  Деталей: ${productDetails.length}, зв'язків: ${productIngredients.length}`)
  await upsert('agro_product_details', productDetails)
  await upsert('agro_product_ingredients', productIngredients)

  // 5. Бур'яни
  console.log('🌾 Бур\'яни...')
  const weeds = await fetchAllOffset('/v1/weeds')
  await upsert('agro_weeds', weeds.map(w => ({
    id: w.id, name: w.name, slug: w.slug,
    latin_name: w.latin_name || null,
    family: w.family || null,
    crops_affected: w.crops_affected || null,
    distribution_zones: w.distribution_zones || null,
    source_image_url: w.source_image_url || null,
    category_id: w.weed_categories?.id || null,
    category_name: w.weed_categories?.name || null,
    category_slug: w.weed_categories?.slug || null,
    class_id: w.weed_classes?.id || null,
    class_name: w.weed_classes?.name || null,
    class_slug: w.weed_classes?.slug || null,
  })))

  // 6. Хвороби
  console.log('🦠 Хвороби...')
  const diseases = await fetchAllOffset('/v1/diseases')
  await upsert('agro_diseases', diseases.map(d => ({
    id: d.id, name: d.name, slug: d.slug,
    latin_name: d.latin_name || null,
    culture: d.culture || null,
    source_image_url: d.source_image_url || null,
    category_id: d.disease_categories?.id || null,
    category_name: d.disease_categories?.name || null,
    category_slug: d.disease_categories?.slug || null,
  })))

  console.log('\n✅ Міграція завершена!')
  console.log('   Тепер можна переписати useAgroApi на прямі Supabase запити')
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) })

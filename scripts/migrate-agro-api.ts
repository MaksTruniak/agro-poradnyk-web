/**
 * Міграція даних з AgroAPI → Supabase
 * Запуск: npx tsx scripts/migrate-agro-api.ts
 */

import { createClient } from '@supabase/supabase-js'

const API_BASE = 'https://agro-api-production-1e91.up.railway.app'
const API_KEY = 'agp_live_c1d866d8c557d5df57953afeb8f98e88b5f74d69baa4cbcd261c4c75c02e67b3'
const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Потрібен SUPABASE_SERVICE_KEY (service_role key з Supabase → Settings → API)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const headers = { 'Authorization': `Bearer ${API_KEY}` }

const apiFetch = (path: string) =>
  fetch(`${API_BASE}${path}`, { headers }).then(r => r.json())

async function fetchAll<T>(path: string, key = 'items'): Promise<T[]> {
  const results: T[] = []
  let page = 1
  const limit = 100
  while (true) {
    const data = await apiFetch(`${path}?limit=${limit}&page=${page}`)
    const items: T[] = data[key] || data.data || []
    results.push(...items)
    console.log(`  ${path} page ${page}: +${items.length} (total ${results.length})`)
    const total = data.meta?.total || data.total || 0
    if (results.length >= total || items.length < limit) break
    page++
  }
  return results
}

async function fetchAllOffset<T>(path: string): Promise<T[]> {
  const results: T[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const data = await apiFetch(`${path}?limit=${limit}&offset=${offset}`)
    const items: T[] = data.items || []
    results.push(...items)
    console.log(`  ${path} offset ${offset}: +${items.length} (total ${results.length})`)
    const total = data.total || 0
    if (results.length >= total || items.length < limit) break
    offset += limit
  }
  return results
}

async function upsert(table: string, rows: any[], chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' })
    if (error) throw new Error(`${table} chunk ${i}: ${error.message}`)
    console.log(`  ✅ ${table}: вставлено ${i + chunk.length}/${rows.length}`)
  }
}

async function main() {
  console.log('\n🚀 Починаємо міграцію...\n')

  // 1. Виробники
  console.log('📦 Виробники...')
  const manufacturers = await apiFetch('/v1/manufacturers').then(d => d.items || [])
  console.log(`  Знайдено: ${manufacturers.length}`)
  await upsert('agro_manufacturers', manufacturers.map((m: any) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    website_url: m.website_url || null,
    country: m.country || null,
    is_active: m.is_active ?? true,
  })))

  // 2. Діючі речовини
  console.log('\n🧪 Діючі речовини...')
  const ingredients = await fetchAllOffset<any>('/v1/active-ingredients')
  console.log(`  Знайдено: ${ingredients.length}`)
  await upsert('agro_active_ingredients', ingredients.map((i: any) => ({
    id: i.id,
    name: i.name,
    slug: i.slug,
    description: i.description || null,
  })))

  // 3. Препарати (без деталей)
  console.log('\n🌿 Препарати...')
  const products = await fetchAll<any>('/v1/products')
  console.log(`  Знайдено: ${products.length}`)
  await upsert('agro_products', products.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    type: p.type,
    source_image_url: p.source_image_url || null,
    market_segment: p.market_segment || null,
    seed_crop: p.seed_crop || null,
    seed_maturity_group: p.seed_maturity_group || null,
    seed_yield_potential: p.seed_yield_potential || null,
    seed_recommended_zone: p.seed_recommended_zone || null,
    manufacturer_id: null, // заповниться нижче
    manufacturer_slug: p.manufacturer?.slug || null,
    formulation_code: p.formulation_type?.code || null,
    formulation_name: p.formulation_type?.name || null,
  })))

  // Проставляємо manufacturer_id
  console.log('  Зв\'язуємо виробників...')
  const mfMap = new Map(manufacturers.map((m: any) => [m.slug, m.id]))
  const productsWithMf = products
    .filter((p: any) => p.manufacturer?.slug && mfMap.has(p.manufacturer.slug))
    .map((p: any) => ({ id: p.id, manufacturer_id: mfMap.get(p.manufacturer.slug) }))
  for (let i = 0; i < productsWithMf.length; i += 500) {
    const chunk = productsWithMf.slice(i, i + 500)
    for (const row of chunk) {
      await supabase.from('agro_products').update({ manufacturer_id: row.manufacturer_id }).eq('id', row.id)
    }
    console.log(`  ✅ manufacturer_id: ${i + chunk.length}/${productsWithMf.length}`)
  }

  // 4. Деталі препаратів (description, content_sections, active_ingredients)
  console.log('\n📋 Деталі препаратів...')
  const productDetails: any[] = []
  const productIngredients: any[] = []

  let done = 0
  for (const p of products) {
    try {
      const data = await apiFetch(`/v1/products/${p.slug}`)
      const detail = data.product || data
      if (detail && detail.id) {
        productDetails.push({
          id: detail.id,
          description: detail.description || null,
          source_url: detail.source_url || null,
          chem_class: detail.chem_class || null,
          dosage: detail.dosage || null,
          crops: detail.crops || null,
          pests: detail.pests || null,
          content_sections: detail.content_sections?.length ? detail.content_sections : null,
        })
        for (const ai of (detail.active_ingredients || [])) {
          productIngredients.push({
            product_id: detail.id,
            ingredient_id: ai.id,
            concentration: ai.concentration || null,
          })
        }
      }
    } catch {}
    done++
    if (done % 100 === 0) console.log(`  деталі: ${done}/${products.length}`)
  }
  console.log(`  Деталей: ${productDetails.length}, зв'язків AI: ${productIngredients.length}`)
  await upsert('agro_product_details', productDetails)
  await upsert('agro_product_ingredients', productIngredients)

  // 5. Бур'яни
  console.log('\n🌿 Бур\'яни...')
  const weeds = await fetchAllOffset<any>('/v1/weeds')
  console.log(`  Знайдено: ${weeds.length}`)
  await upsert('agro_weeds', weeds.map((w: any) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
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
  console.log('\n🦠 Хвороби...')
  const diseases = await fetchAllOffset<any>('/v1/diseases')
  console.log(`  Знайдено: ${diseases.length}`)
  await upsert('agro_diseases', diseases.map((d: any) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    latin_name: d.latin_name || null,
    culture: d.culture || null,
    source_image_url: d.source_image_url || null,
    category_id: d.disease_categories?.id || null,
    category_name: d.disease_categories?.name || null,
    category_slug: d.disease_categories?.slug || null,
  })))

  console.log('\n✅ Міграція завершена!')
}

main().catch(e => { console.error('❌', e); process.exit(1) })

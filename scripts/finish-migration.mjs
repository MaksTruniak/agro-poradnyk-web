/**
 * Доміграція: product_ingredients + weeds + diseases
 * Запускати після основного скрипту якщо він впав на ingredients
 */
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const API_BASE = 'https://agro-api-production-1e91.up.railway.app'
const API_KEY = 'agp_live_c1d866d8c557d5df57953afeb8f98e88b5f74d69baa4cbcd261c4c75c02e67b3'
const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })
const apiFetch = (path) =>
  fetch(`${API_BASE}${path}`, { headers: { 'Authorization': `Bearer ${API_KEY}` } }).then(r => r.json())

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

async function upsert(table, rows, onConflict = 'id', chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict })
    if (error) { console.error(`\n❌ ${table}:`, error.message); throw error }
    process.stdout.write(`\r  ✅ ${table}: ${i + chunk.length}/${rows.length}   `)
  }
  console.log()
}

async function main() {
  console.log('\n🔧 Доміграція решти даних...\n')

  // Беремо продукти з Supabase (не треба знову з API)
  console.log('📋 Завантажуємо продукти з Supabase...')
  let allProducts = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase.from('agro_products').select('id,slug').range(from, from + PAGE - 1)
    if (error) throw error
    allProducts.push(...data)
    process.stdout.write(`\r  продукти: ${allProducts.length}   `)
    if (data.length < PAGE) break
    from += PAGE
  }
  console.log(`\n  Знайдено: ${allProducts.length}`)

  // Product ingredients (ті де немає в БД)
  console.log('\n🧪 Збираємо діючі речовини з деталей...')
  const productIngredients = []
  let done = 0
  const BATCH = 20 // паралельні запити
  for (let i = 0; i < allProducts.length; i += BATCH) {
    const batch = allProducts.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(p =>
      apiFetch(`/v1/products/${p.slug}`).catch(() => null)
    ))
    for (const data of results) {
      const d = data?.product || data
      if (d?.id) {
        for (const ai of (d.active_ingredients || [])) {
          productIngredients.push({ product_id: d.id, ingredient_id: ai.id, concentration: ai.concentration || null })
        }
      }
    }
    done += batch.length
    if (done % 500 === 0) process.stdout.write(`\r  деталі: ${done}/${allProducts.length}   `)
  }
  console.log(`\n  Зв'язків (до фільтру): ${productIngredients.length}`)

  // Завантажуємо валідні ingredient_id з Supabase
  console.log('  Перевіряємо ingredient_id...')
  const { data: validIngredients } = await supabase.from('agro_active_ingredients').select('id')
  const validIds = new Set((validIngredients || []).map(i => i.id))
  const filteredIngredients = productIngredients.filter(r => validIds.has(r.ingredient_id))
  console.log(`  Валідних зв'язків: ${filteredIngredients.length}`)

  if (filteredIngredients.length) {
    await upsert('agro_product_ingredients', filteredIngredients, 'product_id,ingredient_id')
  }

  // Бур'яни
  console.log('\n🌾 Бур\'яни...')
  const weeds = await fetchAllOffset('/v1/weeds')
  await upsert('agro_weeds', weeds.map(w => ({
    id: w.id, name: w.name, slug: w.slug,
    latin_name: w.latin_name || null, family: w.family || null,
    crops_affected: w.crops_affected || null, distribution_zones: w.distribution_zones || null,
    source_image_url: w.source_image_url || null,
    category_id: w.weed_categories?.id || null, category_name: w.weed_categories?.name || null, category_slug: w.weed_categories?.slug || null,
    class_id: w.weed_classes?.id || null, class_name: w.weed_classes?.name || null, class_slug: w.weed_classes?.slug || null,
  })))

  // Хвороби
  console.log('\n🦠 Хвороби...')
  const diseases = await fetchAllOffset('/v1/diseases')
  await upsert('agro_diseases', diseases.map(d => ({
    id: d.id, name: d.name, slug: d.slug,
    latin_name: d.latin_name || null, culture: d.culture || null,
    source_image_url: d.source_image_url || null,
    category_id: d.disease_categories?.id || null, category_name: d.disease_categories?.name || null, category_slug: d.disease_categories?.slug || null,
  })))

  console.log('\n✅ Все завершено!')
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) })

// Окремий запуск для добрив
async function migrateFertilizers() {
  const { createClient } = await import('@supabase/supabase-js')
  const ws = (await import('ws')).default

  const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''
  const API_BASE = 'https://agro-api-production-1e91.up.railway.app'
  const API_KEY = 'agp_live_c1d866d8c557d5df57953afeb8f98e88b5f74d69baa4cbcd261c4c75c02e67b3'

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })

  console.log('\n🌱 Міграція добрив...')
  let all = []
  let offset = 0
  while (true) {
    const data = await fetch(`${API_BASE}/v1/fertilizers?limit=100&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    }).then(r => r.json())
    const items = data.items || []
    all.push(...items)
    process.stdout.write(`\r  ${all.length}/${data.total}   `)
    if (items.length < 100) break
    offset += 100
  }
  console.log(`\n  Знайдено: ${all.length}`)

  const rows = all.map(f => ({
    id: f.id, name: f.name, slug: f.slug,
    category_slug: f.category_slug || null,
    category_id: f.category_id || null,
    formula: f.formula || null,
    composition: f.composition || null,
    mass_fraction: f.mass_fraction || null,
    fertilizer_form: f.fertilizer_form || null,
    fertilizer_type: f.fertilizer_type || null,
    manufacturer: f.manufacturer || null,
    source_url: f.source_url || null,
    source_image_url: f.source_image_url || null,
    is_active: f.is_active ?? true,
  }))

  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500)
    const { error } = await supabase.from('agro_fertilizers').upsert(chunk, { onConflict: 'id' })
    if (error) { console.error('\n❌', error.message); process.exit(1) }
    process.stdout.write(`\r  ✅ agro_fertilizers: ${i + chunk.length}/${rows.length}   `)
  }
  console.log('\n✅ Добрива перенесено!')
}

migrateFertilizers().catch(e => { console.error('\n❌', e.message); process.exit(1) })

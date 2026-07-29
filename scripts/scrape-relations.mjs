import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { execSync } from 'child_process'

const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb296Z2N4Zmpub2d6a3htamF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIzNDQ3MCwiZXhwIjoyMDkzODEwNDcwfQ.ZYSZkh4CWqJdYZxvVaz1YjXNyF6LPszff6437TkrXQs'
const API_BASE = 'https://agro-api-production-1e91.up.railway.app'
const API_KEY = 'agp_live_c1d866d8c557d5df57953afeb8f98e88b5f74d69baa4cbcd261c4c75c02e67b3'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })

function curlGet(url) {
  try {
    return execSync(
      `curl -s -L --max-time 15 -H "User-Agent: Mozilla/5.0" "${url}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    )
  } catch { return '' }
}

// Витягуємо ID продуктів з HTML (product-card-light посилання)
function extractProductIds(html) {
  const ids = new Set()
  for (const m of html.matchAll(/href="https?:\/\/superagronom\.com\/pesticidi[^"]*-id(\d+)"/g)) {
    ids.add(parseInt(m[1]))
  }
  return [...ids]
}

// Завантажуємо всі продукти з нашої БД
async function loadProducts() {
  const all = []
  let pg = 0
  while (true) {
    const { data } = await supabase.from('agro_products').select('id, slug').range(pg * 1000, pg * 1000 + 999)
    if (!data?.length) break
    all.push(...data)
    if (data.length < 1000) break
    pg++
  }
  return Object.fromEntries(all.map(p => [p.slug, p.id]))
}

// === ХВОРОБИ ===
async function migrateDiseases(productBySlug) {
  console.log('\n🦠 Хвороби → препарати (scraping superagronom)')
  const { data: diseases } = await supabase.from('agro_diseases').select('id, slug')
  let linked = 0, skipped = 0

  for (let i = 0; i < diseases.length; i++) {
    const disease = diseases[i]
    process.stdout.write(`\r  ${i + 1}/${diseases.length} | збережено: ${linked} | ${disease.slug.slice(-10)}`)

    // Отримуємо source_url з AgroAPI
    let sourceUrl
    try {
      const resp = execSync(
        `curl -s --max-time 10 "${API_BASE}/v1/diseases/${disease.slug}" -H "Authorization: Bearer ${API_KEY}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      )
      sourceUrl = JSON.parse(resp)?.disease?.source_url
    } catch { skipped++; continue }

    if (!sourceUrl) { skipped++; continue }

    const html = curlGet(sourceUrl)
    if (!html) { skipped++; continue }

    const productIds = extractProductIds(html)
    const rows = productIds
      .map(id => ({ disease_id: disease.id, product_id: productBySlug[`sa-${id}`] }))
      .filter(r => r.product_id)

    if (rows.length) {
      await supabase.from('agro_disease_products').upsert(rows, { onConflict: 'disease_id,product_id' })
      linked += rows.length
    }

    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\n  ✅ Хвороби: ${linked} зв'язків, ${skipped} пропущено`)
  return linked
}

// === ШКІДНИКИ ===
async function migratePests(productBySlug) {
  console.log('\n🐛 Шкідники → препарати (scraping superagronom)')

  // Збираємо всі URL шкідників зі сторінок списку
  const pestUrls = []
  for (let page = 1; page <= 25; page++) {
    const html = curlGet(`https://superagronom.com/shkidniki?sort=name&page=${page}`)
    const matches = [...html.matchAll(/href="(\/shkidniki-[^"?]+)"/g)]
    const pageUrls = matches.map(m => m[1]).filter(u => u.includes('-id'))
    if (!pageUrls.length) break
    pestUrls.push(...pageUrls)
    await new Promise(r => setTimeout(r, 150))
  }

  // Маппінг ID → pest UUID
  const { data: pests } = await supabase.from('agro_pests').select('id, slug')
  const pestBySlug = Object.fromEntries(pests.map(p => [p.slug, p.id]))

  let linked = 0

  for (let i = 0; i < pestUrls.length; i++) {
    const urlPath = pestUrls[i]
    const idMatch = urlPath.match(/-id(\d+)$/)
    if (!idMatch) continue

    const saSlug = `sa-pest-${idMatch[1]}`
    const pestId = pestBySlug[saSlug]
    if (!pestId) continue

    process.stdout.write(`\r  ${i + 1}/${pestUrls.length} | збережено: ${linked} | ${urlPath.split('/').pop().slice(0, 35)}`)

    const html = curlGet(`https://superagronom.com${urlPath}`)
    if (!html) continue

    const productIds = extractProductIds(html)
    const rows = productIds
      .map(id => ({ pest_id: pestId, product_id: productBySlug[`sa-${id}`] }))
      .filter(r => r.product_id)

    if (rows.length) {
      await supabase.from('agro_pest_products').upsert(rows, { onConflict: 'pest_id,product_id' })
      linked += rows.length
    }

    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\n  ✅ Шкідники: ${linked} зв'язків`)
  return linked
}

async function run() {
  console.log('💊 Завантажуємо продукти...')
  const productBySlug = await loadProducts()
  console.log(`  ${Object.keys(productBySlug).length} продуктів`)

  await migrateDiseases(productBySlug)
  await migratePests(productBySlug)

  console.log('\n✅ Все готово!')
}

run().catch(console.error)

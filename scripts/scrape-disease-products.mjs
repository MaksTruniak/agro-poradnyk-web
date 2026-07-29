import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { execSync } from 'child_process'

const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb296Z2N4Zmpub2d6a3htamF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIzNDQ3MCwiZXhwIjoyMDkzODEwNDcwfQ.ZYSZkh4CWqJdYZxvVaz1YjXNyF6LPszff6437TkrXQs'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })

const CATEGORIES = [
  'pesticidi-fungicidi',
  'pesticidi-gerbicidi',
  'pesticidi-insekticidi-i-akaricidi',
  'pesticidi-protruyniki',
  'pesticidi-regulyatori-rostu',
  'pesticidi-rodenticidi',
]

function curlGet(url) {
  try {
    return execSync(
      `curl -s -L --max-time 10 -H "User-Agent: Mozilla/5.0" "${url}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    )
  } catch {
    return ''
  }
}

function extractProductIds(html) {
  const ids = new Set()
  const matches = html.matchAll(/href="\/pesticidi[^"]*-id(\d+)"/g)
  for (const m of matches) {
    ids.add(parseInt(m[1]))
  }
  return [...ids]
}

async function getProductSlugsForDisease(diseaseId) {
  const allIds = new Set()
  for (const cat of CATEGORIES) {
    let page = 1
    while (true) {
      const url = `https://superagronom.com/${cat}?disease=${diseaseId}&page=${page}`
      const html = curlGet(url)
      if (!html) break

      const ids = extractProductIds(html)
      if (!ids.length) break
      ids.forEach(id => allIds.add(id))

      // Якщо є посилання на наступну сторінку
      if (!html.includes(`page=${page + 1}`)) break
      page++
    }
  }
  return [...allIds].map(id => `sa-${id}`)
}

async function run() {
  const { data: diseases } = await supabase.from('agro_diseases').select('id, slug')
  console.log(`🦠 Хвороб: ${diseases.length}`)

  // Завантажимо всі продукти (з пагінацією)
  const allProducts = []
  let pg = 0
  while (true) {
    const { data } = await supabase.from('agro_products').select('id, slug').range(pg * 1000, pg * 1000 + 999)
    if (!data?.length) break
    allProducts.push(...data)
    if (data.length < 1000) break
    pg++
  }
  const productBySlug = Object.fromEntries(allProducts.map(p => [p.slug, p.id]))
  console.log(`💊 Продуктів: ${allProducts.length}`)

  let linked = 0, missing = 0, skipped = 0

  for (let i = 0; i < diseases.length; i++) {
    const disease = diseases[i]
    // Беремо лише хвороби з superagronom (slug: sa-disease-XXXX)
    const match = disease.slug.match(/^sa-disease-(\d+)$/)
    if (!match) { skipped++; continue }

    const diseaseId = match[1]
    process.stdout.write(`\r  ${i + 1}/${diseases.length} | linked: ${linked} | ${disease.slug}                    `)

    const productSlugs = await getProductSlugsForDisease(diseaseId)

    const rows = productSlugs
      .map(slug => ({ disease_id: disease.id, product_id: productBySlug[slug] }))
      .filter(r => r.product_id)

    missing += productSlugs.length - rows.length

    if (rows.length) {
      await supabase.from('agro_disease_products').upsert(rows, { onConflict: 'disease_id,product_id' })
      linked += rows.length
    }

    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n\n✅ Готово: ${linked} зв'язків збережено, ${missing} не знайдено, ${skipped} пропущено`)
}

run().catch(console.error)

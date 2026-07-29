import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { execSync } from 'child_process'

const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb296Z2N4Zmpub2d6a3htamF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIzNDQ3MCwiZXhwIjoyMDkzODEwNDcwfQ.ZYSZkh4CWqJdYZxvVaz1YjXNyF6LPszff6437TkrXQs'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })

function curlGet(url) {
  try {
    return execSync(
      `curl -s -L --max-time 20 -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${url}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    )
  } catch { return '' }
}

function extractImageUrl(html) {
  // 1. LD+JSON schema.org image
  const ldMatch = html.match(/"image"\s*:\s*"(https?:\/\/[^"]+)"/)
  if (ldMatch) return ldMatch[1]

  // 2. og:image meta tag
  const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
  if (ogMatch) return ogMatch[1]

  // 3. Основне фото продукту — img з src що містить /uploads/ або /images/
  const imgMatch = html.match(/<img[^>]+src="(https?:\/\/[^"]*(?:\/uploads\/|\/images\/|superagronom[^"]*\.(jpg|jpeg|png|webp)))"/)
  if (imgMatch) return imgMatch[1]

  return null
}

async function loadProducts() {
  const all = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('agro_products')
      .select('id, slug')
      .is('source_image_url', null)
      .range(page * 500, page * 500 + 499)
    if (!data?.length) break
    all.push(...data)
    if (data.length < 500) break
    page++
  }
  return all
}

async function loadSourceUrls(productIds) {
  const map = {}
  let page = 0
  while (true) {
    const batch = productIds.slice(page * 500, page * 500 + 500)
    if (!batch.length) break
    const { data } = await supabase
      .from('agro_product_details')
      .select('id, source_url')
      .in('id', batch)
      .not('source_url', 'is', null)
    for (const d of data || []) if (d.source_url?.includes('superagronom')) map[d.id] = d.source_url
    page++
  }
  return map
}

async function run() {
  console.log('📦 Завантажуємо продукти без зображень...')
  const products = await loadProducts()
  console.log(`  ${products.length} продуктів без фото`)

  const ids = products.map(p => p.id)
  console.log('🔗 Завантажуємо source_url...')
  const urlMap = await loadSourceUrls(ids)
  console.log(`  ${Object.keys(urlMap).length} посилань на superagronom`)

  const toProcess = products.filter(p => urlMap[p.id])
  console.log(`  ${toProcess.length} продуктів для обробки\n`)

  let found = 0, notFound = 0, skipped = 0

  for (let i = 0; i < toProcess.length; i++) {
    const prod = toProcess[i]
    const url = urlMap[prod.id]
    process.stdout.write(`\r  ${i + 1}/${toProcess.length} | знайдено: ${found} | не знайдено: ${notFound} | ${url.split('/').pop().slice(0, 35)}`)

    const html = curlGet(url)
    if (!html || html.length < 500) { skipped++; continue }

    const imageUrl = extractImageUrl(html)
    if (imageUrl) {
      await supabase.from('agro_products')
        .update({ source_image_url: imageUrl })
        .eq('id', prod.id)
      found++
    } else {
      notFound++
    }

    await new Promise(r => setTimeout(r, 60))
  }

  console.log(`\n\n✅ Готово: знайдено ${found} фото, не знайдено ${notFound}, пропущено ${skipped}`)
}

run().catch(console.error)

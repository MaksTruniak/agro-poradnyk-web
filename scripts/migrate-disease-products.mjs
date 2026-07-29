import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const API_BASE = 'https://agro-api-production-1e91.up.railway.app'
const API_KEY = 'agp_live_c1d866d8c557d5df57953afeb8f98e88b5f74d69baa4cbcd261c4c75c02e67b3'
const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb296Z2N4Zmpub2d6a3htamF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIzNDQ3MCwiZXhwIjoyMDkzODEwNDcwfQ.ZYSZkh4CWqJdYZxvVaz1YjXNyF6LPszff6437TkrXQs'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })
const apiFetch = (path) =>
  fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${API_KEY}` } }).then(r => r.json())

async function run() {
  const { data: diseases } = await supabase.from('agro_diseases').select('id, slug')
  console.log(`🦠 Хвороби: ${diseases.length}`)

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
  console.log(`💊 Продукти: ${allProducts.length}`)

  let linked = 0, missing = 0

  for (let i = 0; i < diseases.length; i++) {
    const disease = diseases[i]
    process.stdout.write(`\r  ${i + 1}/${diseases.length} (${linked} зв'язків)`)

    const { disease: detail } = await apiFetch(`/v1/diseases/${disease.slug}`)
    if (!detail?.products?.length) continue

    const rows = detail.products
      .map(p => ({ disease_id: disease.id, product_id: productBySlug[p.slug] }))
      .filter(r => r.product_id)

    missing += detail.products.length - rows.length

    if (rows.length) {
      await supabase.from('agro_disease_products').upsert(rows, { onConflict: 'disease_id,product_id' })
      linked += rows.length
    }

    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\n\n✅ Готово: ${linked} зв'язків збережено, ${missing} не знайдено в БД`)
}

run().catch(console.error)

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const API_BASE = 'https://agro-api-production-1e91.up.railway.app'
const API_KEY = 'agp_live_c1d866d8c557d5df57953afeb8f98e88b5f74d69baa4cbcd261c4c75c02e67b3'
const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

if (!SUPABASE_SERVICE_KEY) { console.error('❌ Потрібен SUPABASE_SERVICE_KEY'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })

async function main() {
  console.log('\n🌱 Міграція добрив (619)...\n')

  let all = []
  let offset = 0
  while (true) {
    const data = await fetch(`${API_BASE}/v1/fertilizers?limit=100&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    }).then(r => r.json())
    const items = data.items || []
    all.push(...items)
    process.stdout.write(`\r  завантажено: ${all.length}/${data.total}   `)
    if (items.length < 100) break
    offset += 100
  }
  console.log(`\n  Отримано: ${all.length}`)

  const rows = all.map(f => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
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

  console.log('\n\n✅ Добрива перенесено! Тепер Railway більше не потрібен.')
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) })

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { execSync } from 'child_process'

const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb296Z2N4Zmpub2d6a3htamF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIzNDQ3MCwiZXhwIjoyMDkzODEwNDcwfQ.ZYSZkh4CWqJdYZxvVaz1YjXNyF6LPszff6437TkrXQs'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })

function curlGet(url) {
  try {
    return execSync(
      `curl -s -L --max-time 15 -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${url}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    )
  } catch {
    return ''
  }
}

// Збираємо всі URL шкідників зі сторінок списку
async function collectAllPestUrls() {
  const urls = []
  for (let page = 1; page <= 25; page++) {
    const html = curlGet(`https://superagronom.com/shkidniki?sort=name&page=${page}`)
    const matches = [...html.matchAll(/href="(\/shkidniki-[^"?]+)"/g)]
    const pageUrls = matches.map(m => m[1]).filter(u => u.includes('-id'))
    if (!pageUrls.length) break
    urls.push(...pageUrls)
    process.stdout.write(`\r  Збір URL: сторінка ${page}, знайдено ${urls.length}`)
    await new Promise(r => setTimeout(r, 200))
  }
  console.log()
  return [...new Set(urls)]
}

// Парсимо дані одного шкідника
function parsePest(html, url) {
  // ID і slug
  const idMatch = url.match(/-id(\d+)$/)
  if (!idMatch) return null
  const saId = idMatch[1]
  const slug = `sa-pest-${saId}`

  // LD+JSON
  const ldMatch = html.match(/<script type="application\/ld\+json">(\{[^<]*"@type":"Thing"[^<]*\})<\/script>/)
  if (!ldMatch) return null
  let ld
  try { ld = JSON.parse(ldMatch[1]) } catch { return null }

  const name = ld.name?.replace(/\s*\([^)]*\)\s*$/, '').trim() || null
  if (!name) return null

  const latin_name = ld.alternateName || null
  const source_image_url = ld.image || null
  const category_name = ld.disambiguatingDescription || null

  // Категорія slug з URL: /shkidniki-tverdokrili-coleoptera/name-id123 → tverdokrili-coleoptera
  const catMatch = url.match(/\/shkidniki-([^/]+)\//)
  const category_slug = catMatch ? catMatch[1] : null

  // Культура з HTML
  const cultureMatch = html.match(/<div>Культура<\/div>\s*<div>([^<]+)<\/div>/)
  const culture = cultureMatch ? cultureMatch[1].trim() : null

  // Опис
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/)
  const description = descMatch ? descMatch[1].trim() : null

  return { slug, name, latin_name, category_slug, category_name, culture, description, source_image_url }
}

async function run() {
  console.log('🐛 Збираємо URL шкідників...')
  const pestUrls = await collectAllPestUrls()
  console.log(`  Всього URL: ${pestUrls.length}`)

  let saved = 0, failed = 0

  for (let i = 0; i < pestUrls.length; i++) {
    const url = 'https://superagronom.com' + pestUrls[i]
    process.stdout.write(`\r  ${i + 1}/${pestUrls.length} | збережено: ${saved} | ${pestUrls[i].split('/').pop().slice(0, 40)}`)

    const html = curlGet(url)
    if (!html) { failed++; continue }

    const pest = parsePest(html, pestUrls[i])
    if (!pest) { failed++; continue }

    const { error } = await supabase.from('agro_pests').upsert(pest, { onConflict: 'slug' })
    if (error) { failed++; continue }
    saved++

    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n\n✅ Готово: ${saved} збережено, ${failed} помилок`)
}

run().catch(console.error)

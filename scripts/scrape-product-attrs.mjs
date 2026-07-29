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

function parseProductPage(html) {
  const result = { ingredients: [] }

  // Знаходимо блок "Діюча речовина" і витягуємо всі посилання на diyuchi-rechovini
  const ingIdx = html.indexOf('Діюча речовина')
  if (ingIdx > 0) {
    const block = html.slice(ingIdx, ingIdx + 2000)
    const ingMatches = [...block.matchAll(/diyuchi-rechovini\/([^"]+)-id(\d+)"[^>]*>(.*?)<\/a>/gs)]
    for (const m of ingMatches) {
      const name = m[3].replace(/<[^>]+>/g, '').trim()
      const saId = m[2]
      // Концентрація: шукаємо число г/л, г/кг або % поруч з назвою
      const concMatch = block.slice(0, block.indexOf(m[0]) + 200).match(/(\d+[\.,]?\d*)\s*(г\/л|г\/кг|%|мг\/л)/)
      result.ingredients.push({ name, saId, concentration: concMatch ? `${concMatch[1]} ${concMatch[2]}` : null })
    }
  }

  // Препаративна форма, Хімічний клас
  for (const [label, key] of [
    ['Препаративна форма', 'formulation_name'],
    ['Хімічний клас', 'chem_class'],
  ]) {
    const m = html.match(new RegExp(`<div>\\s*${label}\\s*<\\/div>\\s*<div>(.*?)<\\/div>`, 's'))
    if (m) {
      const val = m[1].replace(/<[^>]+>/g, '').trim()
      if (val) result[key] = val
    }
  }

  return result
}

async function loadActiveIngredients() {
  const all = []
  let page = 0
  while (true) {
    const { data } = await supabase.from('agro_active_ingredients').select('id, name').range(page * 500, page * 500 + 499)
    if (!data?.length) break
    all.push(...data)
    if (data.length < 500) break
    page++
  }
  // Нормалізований map: lowercase trim → id
  return Object.fromEntries(all.map(i => [i.name.toLowerCase().trim(), i.id]))
}

async function loadDetails() {
  const all = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('agro_product_details')
      .select('id, source_url, chem_class')
      .like('source_url', '%superagronom%')
      .is('chem_class', null)
      .range(page * 500, page * 500 + 499)
    if (!data?.length) break
    all.push(...data)
    if (data.length < 500) break
    page++
  }
  return all
}

async function run() {
  console.log('🧪 Завантажуємо активні речовини...')
  const ingredientByName = await loadActiveIngredients()
  console.log(`  ${Object.keys(ingredientByName).length} активних речовин`)

  console.log('📦 Завантажуємо продукти без атрибутів...')
  const details = await loadDetails()
  console.log(`  ${details.length} продуктів для обробки`)

  let updated = 0, ingLinked = 0, skipped = 0

  for (let i = 0; i < details.length; i++) {
    const det = details[i]
    process.stdout.write(`\r  ${i + 1}/${details.length} | оновлено: ${updated} | інгредієнтів: ${ingLinked} | ${det.source_url.split('/').pop().slice(0, 30)}`)

    const html = curlGet(det.source_url)
    if (!html || html.length < 500) { skipped++; continue }

    const attrs = parseProductPage(html)

    // Оновлюємо agro_product_details
    const detUpdate = {}
    if (attrs.chem_class) detUpdate.chem_class = attrs.chem_class

    if (Object.keys(detUpdate).length) {
      await supabase.from('agro_product_details').update(detUpdate).eq('id', det.id)
    }

    // Оновлюємо formulation_name в agro_products
    if (attrs.formulation_name) {
      await supabase.from('agro_products')
        .update({ formulation_name: attrs.formulation_name })
        .eq('id', det.id)
        .is('formulation_name', null)
    }

    // Зв'язуємо з активними речовинами
    if (attrs.ingredients.length) {
      const rows = []
      for (const ing of attrs.ingredients) {
        const ingId = ingredientByName[ing.name.toLowerCase().trim()]
        if (ingId) {
          rows.push({ product_id: det.id, ingredient_id: ingId, concentration: ing.concentration })
        }
      }
      if (rows.length) {
        await supabase.from('agro_product_ingredients')
          .upsert(rows, { onConflict: 'product_id,ingredient_id' })
        ingLinked += rows.length
      }
    }

    updated++
    await new Promise(r => setTimeout(r, 80))
  }

  console.log(`\n\n✅ Готово: ${updated} продуктів оновлено, ${ingLinked} зв'язків з інгредієнтами, ${skipped} пропущено`)
}

run().catch(console.error)

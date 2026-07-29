import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { execSync } from 'child_process'

const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb296Z2N4Zmpub2d6a3htamF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIzNDQ3MCwiZXhwIjoyMDkzODEwNDcwfQ.ZYSZkh4CWqJdYZxvVaz1YjXNyF6LPszff6437TkrXQs'
const BUCKET = 'product-images'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })

function downloadImage(url) {
  try {
    const buffer = execSync(
      `curl -s -L --max-time 20 -H "User-Agent: Mozilla/5.0" "${url}"`,
      { stdio: ['pipe', 'pipe', 'ignore'], maxBuffer: 10 * 1024 * 1024 }
    )
    const ext = url.split('?')[0].split('.').pop().toLowerCase()
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    return { buffer, contentType }
  } catch { return null }
}

async function run() {
  let page = 0, total = 0, migrated = 0, skipped = 0

  while (true) {
    const { data } = await supabase
      .from('agro_pests')
      .select('id, slug, source_image_url')
      .not('source_image_url', 'is', null)
      .range(page * 100, (page + 1) * 100 - 1)
      .order('slug')

    if (!data?.length) break

    for (const row of data) {
      total++
      if (row.source_image_url.includes(SUPABASE_URL)) { skipped++; process.stdout.write('-'); continue }

      const storageSlug = `pest-${row.slug}`
      const ext = row.source_image_url.split('?')[0].split('.').pop().toLowerCase() || 'jpg'
      const path = `${storageSlug}.${ext}`

      const image = downloadImage(row.source_image_url)
      if (!image) { process.stdout.write('✗'); continue }

      const { error } = await supabase.storage.from(BUCKET).upload(path, image.buffer, {
        contentType: image.contentType, upsert: false,
      })
      if (error && !error.message.includes('already exists')) { process.stdout.write('✗'); continue }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      await supabase.from('agro_pests').update({ source_image_url: urlData.publicUrl }).eq('id', row.id)
      migrated++
      process.stdout.write('✓')
    }

    process.stdout.write(` [${total}]\n`)
    page++
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n✅ Шкідники: ${total} всього, ${migrated} перенесено, ${skipped} пропущено`)
}

run().catch(console.error)

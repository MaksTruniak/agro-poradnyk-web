import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const SUPABASE_URL = 'https://xpoozgcxfjnogzkxmjaw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb296Z2N4Zmpub2d6a3htamF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIzNDQ3MCwiZXhwIjoyMDkzODEwNDcwfQ.ZYSZkh4CWqJdYZxvVaz1YjXNyF6LPszff6437TkrXQs'
const BUCKET = 'product-images'

const PLACEHOLDER_PATTERNS = [
  'sx-filter__skeeks-cms-components-imaging-filters-Thumbnail',
  'nophoto', 'no-photo', 'no_photo',
  'noimage', 'no-image', 'no_image',
]

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws },
})

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Cannot create bucket: ${error.message}`)
    console.log(`✅ Bucket "${BUCKET}" created`)
  } else {
    console.log(`✅ Bucket "${BUCKET}" exists`)
  }
}

function isPlaceholder(url) {
  if (!url) return true
  return PLACEHOLDER_PATTERNS.some(p => url.includes(p))
}

function getExtension(url) {
  try {
    const pathname = new URL(url).pathname
    const ext = pathname.split('.').pop()?.split('?')[0]?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) ? ext : 'jpg'
  } catch {
    return 'jpg'
  }
}

async function downloadImage(url) {
  try {
    // Base64 data URI склеєний з URL — витягуємо
    const dataMatch = url.match(/data:(image\/[^;]+);base64,(.+)/)
    if (dataMatch) {
      const contentType = dataMatch[1]
      const buffer = Buffer.from(dataMatch[2], 'base64').buffer
      return { buffer, contentType }
    }

    // Encode пробіли та спец-символи в шляху URL
    const parsedUrl = new URL(url)
    parsedUrl.pathname = parsedUrl.pathname.split('/').map(s => encodeURIComponent(decodeURIComponent(s))).join('/')
    const cleanUrl = parsedUrl.toString()

    const origin = parsedUrl.origin
    const headers = [
      `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`,
      `-H "Accept: image/avif,image/webp,image/apng,image/*,*/*;q=0.8"`,
      `-H "Accept-Language: uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7"`,
      `-H "Accept-Encoding: gzip, deflate, br"`,
      `-H "Referer: ${origin}/"`,
    ].join(' ')

    const { execSync } = await import('child_process')
    execSync(
      `curl -sL --max-time 20 ${headers} "${cleanUrl}" -o /tmp/_migimg`,
      { stdio: 'pipe' }
    )
    const { readFileSync, statSync } = await import('fs')
    let sz = 0
    try { sz = statSync('/tmp/_migimg').size } catch { return null }
    if (sz === 0) { console.error(`\n  ✗ empty: ${url}`); return null }
    const buffer = readFileSync('/tmp/_migimg').buffer
    const contentType = url.endsWith('.webp') ? 'image/webp'
      : url.endsWith('.png') ? 'image/png'
      : url.endsWith('.svg') ? 'image/svg+xml'
      : 'image/jpeg'
    return { buffer, contentType }
  } catch (e) {
    console.error(`\n  ✗ curl error: ${e.message?.slice(0, 120)} | url: ${url}`)
    return null
  }
}

async function uploadImage(slug, url) {
  const ext = getExtension(url)
  const path = `${slug}.${ext}`

  // Перевіряємо чи вже є
  const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: path })
  if (existing?.length) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  const image = await downloadImage(url)
  if (!image) return null

  const { error } = await supabase.storage.from(BUCKET).upload(path, image.buffer, {
    contentType: image.contentType,
    upsert: false,
  })
  if (error) { console.error(`\n  ❌ Upload error for ${slug}: ${error.message} (url: ${url})`); return null }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function migrateTable(tableName, prefix = '') {
  let page = 0
  const batchSize = 100
  let total = 0, migrated = 0, skipped = 0

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, slug, source_image_url')
      .not('source_image_url', 'is', null)
      .range(page * batchSize, (page + 1) * batchSize - 1)
      .order('id')

    if (error) { console.error('DB error:', error.message); break }
    if (!data?.length) break

    console.log(`\n📦 Batch ${page + 1}: ${data.length} rows`)

    for (const row of data) {
      total++
      if (isPlaceholder(row.source_image_url)) {
        await supabase.from(tableName).update({ source_image_url: null }).eq('id', row.id)
        skipped++
        process.stdout.write('.')
        continue
      }

      if (row.source_image_url.includes(SUPABASE_URL)) {
        skipped++
        process.stdout.write('-')
        continue
      }

      const storageSlug = prefix ? `${prefix}-${row.slug}` : row.slug
      const newUrl = await uploadImage(storageSlug, row.source_image_url)
      if (newUrl) {
        await supabase.from(tableName).update({ source_image_url: newUrl }).eq('id', row.id)
        migrated++
        process.stdout.write('✓')
      } else {
        process.stdout.write('✗')
      }
    }

    page++
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n✅ ${tableName}: ${total} total, ${migrated} migrated, ${skipped} skipped`)
  return { total, migrated, skipped }
}

async function run() {
  await ensureBucket()

  console.log('\n🌿 Бур\'яни (agro_weeds)')
  await migrateTable('agro_weeds', 'weed')

  console.log('\n🦠 Хвороби (agro_diseases)')
  await migrateTable('agro_diseases', 'disease')

  console.log('\n💊 Продукти (agro_products)')
  await migrateTable('agro_products')

  console.log('\n🐛 Шкідники (agro_pests)')
  await migrateTable('agro_pests', 'pest')
}

run().catch(console.error)

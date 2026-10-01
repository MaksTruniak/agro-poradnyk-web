import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

const BUCKET = process.env.S3_BUCKET || 'chat-images'

// Лише картинки; розширення — з типу файлу, а не з імені
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}
const MAX_SIZE = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)
  const formData = await readFormData(event)
  const file = formData.get('file') as File
  const chatId = formData.get('chatId') as string

  if (!file || !chatId) {
    throw createError({ statusCode: 400, message: 'Missing file or chatId' })
  }

  // Завантажувати може лише учасник цього чату
  const { data: chat } = await supabase.from('chats').select('farmer_id, agronomist_id').eq('id', chatId).maybeSingle()
  if (!chat || (chat.farmer_id !== user.id && chat.agronomist_id !== user.id)) {
    throw createError({ statusCode: 403, message: 'Немає доступу до чату' })
  }

  const ext = IMAGE_TYPES[file.type]
  if (!ext) throw createError({ statusCode: 400, message: 'Можна завантажувати лише зображення' })
  if (file.size > MAX_SIZE) throw createError({ statusCode: 400, message: 'Файл більше 10 МБ' })

  const key = `${chatId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))
  } catch (err) {
    console.error('S3 upload error:', err)
    throw createError({ statusCode: 500, message: 'Не вдалося завантажити зображення' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || ''
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${key}`

  return { url: publicUrl }
})

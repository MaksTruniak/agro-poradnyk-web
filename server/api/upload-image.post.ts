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

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const file = formData.get('file') as File
  const chatId = formData.get('chatId') as string

  if (!file || !chatId) {
    throw createError({ statusCode: 400, message: 'Missing file or chatId' })
  }

  const ext = file.name.split('.').pop() || 'jpg'
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
    throw createError({ statusCode: 500, message: 'Upload failed: ' + String(err) })
  }

  const supabaseUrl = process.env.SUPABASE_URL || ''
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${key}`

  return { url: publicUrl }
})

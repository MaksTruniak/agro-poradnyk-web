// Стиснення фото перед відправленням AI агроному: довша сторона до maxSide px, JPEG.
// createImageBitmap з imageOrientation: 'from-image' враховує EXIF — фото з телефона не повертається боком.
// Повертає data URL; null — якщо стискати не варто (вже маленьке й не потребує зменшення).
export async function compressImage(file: File, maxSide = 1500, quality = 0.8): Promise<string | null> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= 500 * 1024 && file.type === 'image/jpeg') return null
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Прозорість (PNG) на JPEG стала б чорною — підкладаємо білий
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    bitmap.close()
  }
}

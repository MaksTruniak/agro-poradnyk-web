// Картинки чатів лежать у приватному сховищі chat-images. У повідомленні зберігається посилання формату
// .../storage/v1/object/public/chat-images/<chatId>/<file> — з нього беремо шлях і отримуємо тимчасове
// підписане посилання (читати можуть лише учасники чату — правило сховища).
const PUBLIC_MARK = '/storage/v1/object/public/chat-images/'
const SIGNED_TTL = 60 * 60 // 1 година

export const chatImagePath = (url?: string | null) =>
  url && url.includes(PUBLIC_MARK) ? decodeURIComponent(url.split(PUBLIC_MARK)[1]!.split('?')[0]!) : null

export const useChatImages = () => {
  const supabase = useSupabaseClient()
  const signed = reactive<Record<string, string>>({})

  const resolve = async (urls: (string | null | undefined)[]) => {
    const paths = [...new Set(urls.map(chatImagePath).filter((p): p is string => !!p && !signed[p]))]
    if (!paths.length) return
    const { data } = await supabase.storage.from('chat-images').createSignedUrls(paths, SIGNED_TTL)
    for (const d of data || []) {
      if (d.path && d.signedUrl) signed[d.path] = d.signedUrl
    }
  }

  // Посилання для <img>: підписане для картинок чату, інші (наприклад blob: попереднього перегляду) — як є
  const src = (url?: string | null) => {
    const path = chatImagePath(url)
    return path ? signed[path] || '' : url || ''
  }

  return { resolve, src }
}

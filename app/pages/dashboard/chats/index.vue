<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="flex items-center gap-2.5 mb-1.5">
        <div class="dash-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 5h16v11H8l-4 4V5z"/>
          </svg>
        </div>
        <h1 class="dash-title bitter">Консультації</h1>
      </div>
      <p class="dash-subtitle">Розмови з агрономами та клієнтами</p>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-20"></div>
    </div>

    <div v-else-if="chats.length === 0" class="card text-center py-16">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 5h16v11H8l-4 4V5z"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Чатів поки немає</p>
      <p class="text-agro-light mb-6" v-if="!isAgronomist">Знайдіть агронома і почніть консультацію</p>
      <NuxtLink v-if="!isAgronomist" to="/agronomists" class="btn-primary inline-block">Знайти агронома →</NuxtLink>
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="chat in chats"
        :key="chat.id"
        :to="`/dashboard/chats/${chat.id}`"
        class="card hover:shadow-md transition-all flex items-center gap-4 group"
      >
        <!-- Аватар -->
        <div class="w-12 h-12 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro text-lg shrink-0">
          {{ chat.interlocutorName?.[0]?.toUpperCase() || '?' }}
        </div>

        <!-- Інфо -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <p class="font-bold text-agro-dark">{{ chat.interlocutorName }}</p>
            <p class="text-xs text-agro-light">{{ formatDate(chat.last_message_at || chat.created_at) }}</p>
          </div>
          <p v-if="chat.title" class="text-xs font-medium text-agro mb-0.5 truncate">{{ chat.title }}</p>
          <p v-if="chat.has_confirmed_deal" class="text-sm font-semibold text-agro truncate">✅ Угода підтверджена</p>
          <p v-else class="text-sm text-agro-light truncate">{{ chat.last_message || 'Немає повідомлень' }}</p>
        </div>

        <!-- Непрочитані -->
        <div v-if="chat.unread > 0" class="w-5 h-5 bg-agro rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
          {{ chat.unread }}
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Чати' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const chats = ref<any[]>([])

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: profileData } = await supabase.from('users').select('role').eq('id', uid).single()
const role = profileData?.role
const isAgronomist = role === 'agronomist'

const formatDate = (d: string) => {
  const date = new Date(d)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 86400000) return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

const load = async () => {
  // Завантажуємо чати де юзер є або в farmer_id або в agronomist_id
  const [res1, res2] = await Promise.all([
    supabase.from('chats').select('*').eq('farmer_id', uid).eq('type', 'human'),
    supabase.from('chats').select('*').eq('agronomist_id', uid).eq('type', 'human'),
  ])
  const merged = [...(res1.data || []), ...(res2.data || [])]
  const seen = new Set<string>()
  const chatsData = merged.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (!chatsData?.length) { loading.value = false; return }

  // Підтягуємо співрозмовника і останнє повідомлення
  const result = await Promise.all(chatsData.map(async (chat) => {
    const interlocutorId = chat.farmer_id === uid ? chat.agronomist_id : chat.farmer_id

    const [userRes, lastMsgRes, unreadRes, dealRes] = await Promise.all([
      supabase.from('users').select('name').eq('id', interlocutorId).single(),
      supabase.from('messages').select('content, created_at').eq('chat_id', chat.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('chat_id', chat.id).eq('role', isAgronomist ? 'user' : 'assistant').eq('is_read', false),
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('chat_id', chat.id).eq('status', 'confirmed'),
    ])

    return {
      ...chat,
      interlocutorName: userRes.data?.name || 'Користувач',
      last_message: lastMsgRes.data?.content?.startsWith('[deal:') ? 'Пропозиція угоди' : (lastMsgRes.data?.content || null),
      last_message_at: lastMsgRes.data?.created_at || chat.created_at,
      unread: unreadRes.count || 0,
      has_confirmed_deal: (dealRes.count || 0) > 0,
    }
  }))

  chats.value = result
  loading.value = false
}

onMounted(load)
</script>

<style scoped>
.dash-page { padding: 44px 56px; font-family: Manrope, sans-serif; max-width: 1196px; }
.dash-head { margin-bottom: 28px; }
.dash-title { font-family: 'Bitter', Georgia, serif; font-weight: 800; font-size: 28px; color: rgb(27,46,27); margin: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-subtitle { font-size: 15.5px; color: rgb(107,122,100); margin: 4px 0 0; }
.dash-icon-box { width: 40px; height: 40px; border-radius: 10px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
@media (max-width: 640px) { .dash-page { padding: 24px 20px; } }
</style>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-extrabold text-agro-dark mb-8">💬 Чати</h1>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-20"></div>
    </div>

    <div v-else-if="chats.length === 0" class="card text-center py-16">
      <p class="text-5xl mb-4">💬</p>
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
          <p class="text-sm text-agro-light truncate">{{ chat.last_message || 'Немає повідомлень' }}</p>
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
  const field = isAgronomist ? 'agronomist_id' : 'farmer_id'
  const { data: chatsData } = await supabase
    .from('chats')
    .select('*')
    .eq(field, uid)
    .eq('type', 'human')
    .order('created_at', { ascending: false })

  if (!chatsData?.length) { loading.value = false; return }

  // Підтягуємо співрозмовника і останнє повідомлення
  const result = await Promise.all(chatsData.map(async (chat) => {
    const interlocutorId = isAgronomist ? chat.farmer_id : chat.agronomist_id

    const [userRes, lastMsgRes, unreadRes] = await Promise.all([
      supabase.from('users').select('name').eq('id', interlocutorId).single(),
      supabase.from('messages').select('content, created_at').eq('chat_id', chat.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('chat_id', chat.id).eq('role', isAgronomist ? 'user' : 'assistant').eq('is_read', false),
    ])

    return {
      ...chat,
      interlocutorName: userRes.data?.name || (isAgronomist ? 'Фермер' : 'Агроном'),
      last_message: lastMsgRes.data?.content || null,
      last_message_at: lastMsgRes.data?.created_at || chat.created_at,
      unread: unreadRes.count || 0,
    }
  }))

  chats.value = result
  loading.value = false
}

onMounted(load)
</script>

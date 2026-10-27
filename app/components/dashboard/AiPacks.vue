<template>
  <div v-if="packs.length" class="card mb-8" data-test="ai-packs">
    <div class="flex items-center gap-3 mb-1">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background: rgb(238,241,227)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M12 11v5M9.5 13.5h5"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-agro-dark">AI-пакети</p>
        <p class="text-xs text-agro-light">Додаткові кредити AI на місяць — до тарифу або без нього</p>
      </div>
    </div>

    <p v-if="active" class="text-sm bg-agro-hover text-agro-dark rounded-xl px-3 py-2 mt-4" data-test="ai-pack-active">
      Діє {{ active.label }} до {{ formatDay(active.expiresAt) }}. Новий пакет можна купити після цієї дати.
    </p>

    <div class="grid sm:grid-cols-2 gap-3 mt-4">
      <div v-for="p in packs" :key="p.id" class="rounded-xl border border-agro-border p-4 flex flex-col gap-2" data-test="ai-pack">
        <div class="flex items-baseline justify-between gap-2">
          <p class="font-bold text-agro-dark">{{ p.label }}</p>
          <p class="text-agro font-extrabold text-lg whitespace-nowrap">{{ p.price_uah }} грн</p>
        </div>
        <p class="text-sm text-agro-light">
          +{{ p.credits }} кредитів на місяць — ≈ {{ p.credits }} питань або {{ Math.floor(p.credits / 5) }} AI техкарт
        </p>
        <button type="button" class="btn-primary text-sm mt-auto" :disabled="!!paying || !!active" :data-test="`ai-pack-buy-${p.id}`" @click="buy(p.id)">
          {{ paying === p.id ? '...' : 'Купити' }}
        </button>
      </div>
    </div>
    <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
    <p class="text-xs text-agro-light mt-3">
      Спершу витрачаються кредити тарифу, потім пакета. Пакет діє місяць від дня оплати, невикористані кредити згоряють.
      Одночасно може діяти лише один пакет.
    </p>
  </div>
</template>

<script setup lang="ts">
// AI-пакети (ai_packs) для профілю сторінки: оплата через WayForPay, як і тарифи (/api/payment/create).
// Одночасно діє лише один пакет — поки він діє, купити новий не можна (сервер теж не дасть).
const props = defineProps<{ profile: SubscriptionProfile }>()

const supabase = useSupabaseClient() as any
const packs = ref<any[]>([])
const active = ref<{ label: string; expiresAt: string } | null>(null)
const formatDay = (iso: string) => new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
const paying = ref('')
const error = ref('')

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  const [{ data }, { data: current }] = await Promise.all([
    supabase.from('ai_packs').select('id, label, price_uah, credits')
      .eq('profile', props.profile).eq('is_active', true).order('sort'),
    session ? supabase.from('ai_credit_topups').select('expires_at, ai_packs(label)')
      .eq('owner_id', session.user.id).eq('profile', props.profile).not('pack_id', 'is', null)
      .gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  packs.value = data || []
  active.value = current ? { label: current.ai_packs?.label || 'AI-пакет', expiresAt: current.expires_at } : null
})

const buy = async (id: string) => {
  paying.value = id
  error.value = ''
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Не авторизовано')
    const res = await $fetch<{ formData: Record<string, any>; endpoint: string }>('/api/payment/create', {
      method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: { plan: id },
    })
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = res.endpoint
    form.style.display = 'none'
    const add = (name: string, value: string) => {
      const input = document.createElement('input')
      input.name = name
      input.value = value
      form.appendChild(input)
    }
    for (const [key, val] of Object.entries(res.formData)) {
      if (Array.isArray(val)) val.forEach(v => add(`${key}[]`, String(v)))
      else if (typeof val === 'object' && val !== null) add(key, JSON.stringify(val))
      else add(key, String(val))
    }
    document.body.appendChild(form)
    form.submit()
  } catch (e: any) {
    error.value = e?.data?.message || 'Не вдалося перейти до оплати. Спробуйте ще раз.'
    paying.value = ''
  }
}
</script>

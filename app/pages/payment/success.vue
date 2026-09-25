<template>
  <div class="min-h-screen flex items-center justify-center bg-agro-bg px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <span class="text-2xl font-extrabold text-agro-dark bitter">🌿 АгроПростір</span>
        </NuxtLink>
      </div>

      <!-- Перевірка -->
      <div v-if="status === 'checking'" class="card text-center py-12">
        <div class="w-16 h-16 rounded-full bg-agro-hover flex items-center justify-center mx-auto mb-6">
          <svg class="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.8"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        </div>
        <h1 class="text-xl font-extrabold text-agro-dark bitter mb-2">Перевіряємо оплату...</h1>
        <p class="text-agro-light text-sm">Зачекайте кілька секунд</p>
      </div>

      <!-- Успіх -->
      <div v-else-if="status === 'success'" class="card text-center py-12">
        <div class="w-20 h-20 rounded-full bg-agro-hover flex items-center justify-center mx-auto mb-6">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold text-agro-dark bitter mb-2">Оплата успішна!</h1>
        <p class="text-agro-light mb-1">Ваш тариф <strong class="text-agro-dark">{{ planLabel }}</strong> активовано.</p>
        <p class="text-agro-light text-sm mb-8">Дякуємо за довіру!</p>
        <NuxtLink to="/dashboard" class="btn-primary inline-flex">
          Перейти в дашборд →
        </NuxtLink>
      </div>

      <!-- Очікування (callback ще не прийшов) -->
      <div v-else-if="status === 'pending'" class="card text-center py-12">
        <div class="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgb(180,130,40)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold text-agro-dark bitter mb-2">Оплата обробляється</h1>
        <p class="text-agro-light mb-1">Ми отримали ваш платіж. Підписка буде активована протягом кількох хвилин.</p>
        <p class="text-agro-light text-sm mb-8">Якщо через 5 хвилин доступ не з'явився — напишіть нам на <a href="mailto:info@agroprostir.com.ua" class="text-agro hover:underline">info@agroprostir.com.ua</a></p>
        <NuxtLink to="/dashboard" class="btn-primary inline-flex">
          Перейти в дашборд →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Оплата — АгроПростір' })

const route = useRoute()
const plan = route.query.plan as string
const supabase = useSupabaseClient()

const PLAN_LABELS: Record<string, string> = {
  business: 'Бізнес',
  business_pro: 'Бізнес Про',
  pro_month: 'PRO (місяць)',
  pro_year: 'PRO (рік)',
  agronomist_pro_month: 'PRO агронома (місяць)',
  agronomist_pro_year: 'PRO агронома (рік)',
  top_agronomist: 'Топ агронома',
  top_seller: 'Топ продавця',
}

const planLabel = computed(() => PLAN_LABELS[plan] || plan || 'PRO')
const status = ref<'checking' | 'success' | 'pending'>('checking')

const PAID_PLANS = ['business', 'business_pro', 'pro', 'premium']

const check = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { status.value = 'pending'; return }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, expires_at, renewal_count')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const basePlan = plan === 'business_pro' ? 'business_pro' : plan.startsWith('agronomist') ? 'pro' : 'business'
    const isActive = sub && PAID_PLANS.includes(sub.plan) && sub.expires_at && new Date(sub.expires_at) > new Date()

    if (isActive && (sub.plan === basePlan || (plan.startsWith('agronomist') && sub.plan === 'pro'))) {
      status.value = 'success'
    } else {
      status.value = 'pending'
    }
  } catch {
    status.value = 'pending'
  }
}

// Перевіряємо одразу, потім ще раз через 3 сек (callback може трохи затриматись)
onMounted(async () => {
  await check()
  if (status.value !== 'success') {
    setTimeout(async () => {
      await check()
    }, 3000)
  }
})
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
</style>

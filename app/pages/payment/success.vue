<template>
  <div class="min-h-screen flex items-center justify-center bg-agro-bg px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <span class="text-2xl font-extrabold text-agro-dark bitter">🌿 АгроПростір</span>
        </NuxtLink>
      </div>

      <div class="card text-center py-12">
        <div class="w-20 h-20 rounded-full bg-agro-hover flex items-center justify-center mx-auto mb-6">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold text-agro-dark bitter mb-2">Оплата успішна!</h1>
        <p class="text-agro-light mb-1">Ваш тариф <strong class="text-agro-dark">{{ planLabel }}</strong> активовано.</p>
        <p class="text-agro-light text-sm mb-8">Доступ відкрито на {{ planPeriod }}. Дякуємо!</p>

        <NuxtLink to="/dashboard" class="btn-primary inline-flex">
          Перейти в дашборд →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Оплата успішна — АгроПростір' })

const route = useRoute()
const plan = route.query.plan as string

const PLAN_LABELS: Record<string, string> = {
  pro_month: 'PRO (місяць)',
  pro_year: 'PRO (рік)',
  business_month: 'Business (місяць)',
  business_year: 'Business (рік)',
  agronomist_pro_month: 'PRO агронома (місяць)',
  agronomist_pro_year: 'PRO агронома (рік)',
  top_agronomist: 'Топ агронома',
  top_seller: 'Топ продавця',
}

const planLabel = computed(() => PLAN_LABELS[plan] || plan || 'PRO')
const planPeriod = computed(() => plan?.endsWith('_year') ? '1 рік' : '1 місяць')
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
</style>

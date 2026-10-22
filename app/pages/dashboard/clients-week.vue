<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6" /><rect x="14" y="4" width="7" height="7" rx="1.5" /><path d="M16 7.5l1.2 1.2L19.5 6.4" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Клієнти цього тижня</h1>
        <p class="dash-subtitle">Ризики, строки очікування, техкарти й фази в насадженнях ваших клієнтів</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-20" />
    </div>

    <div v-else-if="!clients.length" class="card text-center py-14">
      <p class="font-bold text-agro-dark text-lg mb-2">Поки немає активних клієнтів</p>
      <p class="text-agro-light text-sm mb-5 max-w-md mx-auto">
        Коли фермер підтвердить співпрацю, тут щотижня з'являтиметься, що відбувається в його садах і ягідниках: заморозки, погода для хвороб, обробки за техкартою, збір.
      </p>
      <NuxtLink to="/dashboard/agreements" class="dash-btn-primary inline-flex">До угод →</NuxtLink>
    </div>

    <template v-else>
      <!-- Зведення по клієнтах -->
      <div class="cw-summary mb-6" data-test="clients-summary">
        <button v-for="c in clients" :key="c.id" type="button" class="cw-client" :class="{ 'cw-client-on': clientFilter === c.id, 'cw-client-urgent': c.urgent }"
          @click="clientFilter = clientFilter === c.id ? '' : c.id">
          <span class="font-semibold text-agro-dark truncate">{{ c.name }}</span>
          <span class="text-xs" :class="c.urgent ? 'text-red-700 font-semibold' : 'text-agro-light'">
            {{ c.urgent ? `${c.urgent} терміново · ` : '' }}{{ c.items.length ? `${c.items.length} ${plural(c.items.length, 'пункт', 'пункти', 'пунктів')}` : 'усе спокійно' }}
          </span>
        </button>
      </div>

      <div v-if="!isPro" class="card flex flex-wrap items-center gap-4 py-4 px-5 mb-6" data-test="clients-week-locked">
        <div class="w-11 h-11 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 text-xl">🔒</div>
        <div class="flex-1 min-w-[220px]">
          <p class="font-semibold text-agro-dark text-sm">Подробиці плану клієнтів — на тарифі Агроном Про</p>
          <p class="text-xs text-agro-light mt-0.5">Що саме загрожує, коли можна збирати, яка обробка на черзі — і порада клієнту в чат одним натиском.</p>
        </div>
        <NuxtLink to="/dashboard/agronomist-subscription" class="dash-btn-primary shrink-0 text-sm whitespace-nowrap">Агроном Про →</NuxtLink>
      </div>

      <template v-else>
        <div v-if="!shown.length" class="card text-center py-12 text-agro-light">
          <p class="text-3xl mb-2">🌿</p>
          <p class="font-semibold text-agro-dark mb-1">У клієнтів усе спокійно</p>
          <p class="text-sm">Ризиків у прогнозі немає, обробок на поточних фазах і термінових строків не лишилось.</p>
        </div>

        <section v-if="urgent.length" class="mb-6">
          <h2 class="cw-title text-red-800">Терміново</h2>
          <div class="space-y-2">
            <DashboardWeekPlanRow v-for="item in urgent" :key="item.id" :item="item" :crop="cropOf(item.cropId)" :farm="farmOf(item.farmId)"
              :owner="clientOf(item.farmId)?.name" show-farm read-only hide-links :today="today">
              <ClientActions :item="item" />
            </DashboardWeekPlanRow>
          </div>
        </section>

        <section v-for="c in groups" :key="c.id" class="mb-6" data-test="client-section">
          <h2 class="cw-title">{{ c.name }}</h2>
          <div class="space-y-2">
            <DashboardWeekPlanRow v-for="item in c.rest" :key="item.id" :item="item" :crop="cropOf(item.cropId)" :farm="farmOf(item.farmId)"
              show-farm read-only hide-links :today="today">
              <ClientActions :item="item" />
            </DashboardWeekPlanRow>
          </div>
        </section>
      </template>

      <p class="text-xs text-agro-light mt-8">
        Фаза — відмічена в журналі клієнта або орієнтовна за сумою активних температур; строки догляду й збору орієнтовні для Центральної України.
        Журнал обробок і нагадування фермера тут не враховані — їх бачить лише господар.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PlanItem } from '~~/shared/utils/weekPlan'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Клієнти цього тижня — АгроПростір' })

const toast = useToast()
const { loading, isPro, clients, today, load, cropOf, farmOf, clientOf, writeToClient } = useClientsPlan()

const clientFilter = ref('')
const shown = computed(() => clients.value.filter(c => !clientFilter.value || c.id === clientFilter.value).flatMap(c => c.items))
const urgent = computed(() => shown.value.filter(i => i.priority === 'high'))
const groups = computed(() => clients.value
  .filter(c => !clientFilter.value || c.id === clientFilter.value)
  .map(c => ({ ...c, rest: c.items.filter(i => i.priority !== 'high') }))
  .filter(c => c.rest.length))

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
}

// Чернетка поради клієнту: що, де, чому
const draftFor = (item: PlanItem) => {
  const crop = cropOf(item.cropId), farm = farmOf(item.farmId)
  const where = [crop?.crop_type, crop?.variety, farm?.name].filter(Boolean).join(', ')
  return `${item.title}${where ? ` (${where})` : ''}. ${item.detail}`.slice(0, 1000)
}
const writing = ref('')
const write = async (item: PlanItem) => {
  const client = clientOf(item.farmId)
  if (!client) return
  writing.value = item.id
  const chat = await writeToClient(client.id, draftFor(item))
  writing.value = ''
  if (!chat) toast.error('Не вдалося відкрити чат з клієнтом')
}

// Дії агронома в рядку плану: порада в чат, поле, техкарта
const ClientActions = defineComponent({
  props: { item: { type: Object as PropType<PlanItem>, required: true } },
  setup(props) {
    return () => {
      const item = props.item
      const farm = farmOf(item.farmId)
      return h('div', { class: 'contents' }, [
        h('button', { type: 'button', class: 'plan-btn plan-btn-primary', disabled: writing.value === item.id, 'data-test': 'write-client', onClick: () => write(item) }, '✉️ Порада в чат'),
        farm && item.kind === 'treatment'
          ? h(resolveComponent('NuxtLink') as any, { to: `/dashboard/protection/${farm.id}`, class: 'plan-btn' }, () => 'Техкарта →')
          : farm ? h(resolveComponent('NuxtLink') as any, { to: `/dashboard/farm/${farm.id}?readOnly=1`, class: 'plan-btn' }, () => 'Поле →') : null,
        item.cropId ? h(resolveComponent('NuxtLink') as any, { to: `/dashboard/inspection/edit?cropId=${item.cropId}`, class: 'plan-btn', 'data-test': 'new-inspection' }, () => '📝 Акт огляду') : null,
      ])
    }
  },
})

onMounted(load)
</script>

<style scoped>
.cw-title { font-family: 'Bitter', Georgia, serif; font-size: 16px; font-weight: 800; color: rgb(27, 46, 27); margin: 0 0 10px; }
.cw-summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
.cw-client { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; text-align: left; padding: 10px 12px; border-radius: 12px; background: white; border: 1px solid rgb(226, 232, 214); }
.cw-client:hover { border-color: rgb(190, 210, 176); }
.cw-client-urgent { border-color: rgb(252, 202, 202); background: rgb(254, 246, 246); }
.cw-client-on { outline: 2px solid rgb(47, 82, 51); outline-offset: 1px; }
:deep(.plan-btn) { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 9px; font-size: 12px; font-weight: 600; color: rgb(47, 82, 51); background: white; border: 1px solid rgb(214, 224, 196); }
:deep(.plan-btn-primary) { background: rgb(47, 82, 51); border-color: rgb(47, 82, 51); color: white; }
</style>

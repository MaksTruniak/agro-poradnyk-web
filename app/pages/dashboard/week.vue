<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M9 15l2 2 4-4" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">План на тиждень</h1>
        <p class="dash-subtitle">Погода, техкарта, догляд, поради на сезон і нагадування по всіх полях</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-20" />
    </div>

    <div v-else-if="!hasPerennials && !items.length && !tips.length" class="card text-center py-14">
      <p class="font-bold text-agro-dark text-lg mb-2">Поки немає насаджень</p>
      <p class="text-agro-light text-sm mb-5 max-w-md mx-auto">
        Додайте на поле ягідні кущі, полуницю, виноград чи плодові — і тут з'являться погодні ризики, обробки за техкартою на поточній фазі та сезонний догляд.
      </p>
      <NuxtLink to="/dashboard/fields" class="dash-btn-primary inline-flex">До полів →</NuxtLink>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-2 mb-5">
        <template v-if="farmsWithItems.length > 1">
          <button type="button" class="week-filter" :class="{ 'week-filter-on': !farmFilter }" @click="farmFilter = ''">Усі поля</button>
          <button v-for="f in farmsWithItems" :key="f.id" type="button" class="week-filter" :class="{ 'week-filter-on': farmFilter === f.id }" @click="farmFilter = f.id">
            {{ f.name }}
          </button>
        </template>
        <span class="text-sm text-agro-light ml-auto">
          <template v-if="urgent.length">{{ urgent.length }} термін{{ urgent.length === 1 ? 'ова' : 'ових' }} · </template>{{ shown.length }} {{ plural(shown.length, 'справа', 'справи', 'справ') }}
        </span>
      </div>

      <div v-if="!shown.length && !shownTips.length" class="card text-center py-12 text-agro-light">
        <p class="text-3xl mb-2">🌿</p>
        <p class="font-semibold text-agro-dark mb-1">На цей тиждень усе зроблено</p>
        <p class="text-sm">Ризиків у прогнозі немає, обробок на поточній фазі й сезонних робіт не лишилось.</p>
      </div>

      <section v-if="urgent.length" class="mb-6">
        <h2 class="week-section-title text-red-800">Терміново</h2>
        <div class="space-y-2">
          <DashboardWeekPlanRow v-for="item in urgent" :key="item.id" :item="item" :crop="cropOf(item.cropId)" :farm="farmOf(item.farmId)"
            show-farm :read-only="isViewer" :today="today" @done="onDone" @remind="onRemind" />
        </div>
      </section>

      <section v-for="g in groups" :key="g.farm?.id ?? 'none'" class="mb-6">
        <h2 class="week-section-title">
          <NuxtLink v-if="g.farm" :to="`/dashboard/farm/${g.farm.id}`" class="hover:underline">{{ g.farm.name }}</NuxtLink>
          <template v-else>Інше</template>
        </h2>
        <div class="space-y-2">
          <DashboardWeekPlanRow v-for="item in g.items" :key="item.id" :item="item" :crop="cropOf(item.cropId)" :farm="farmOf(item.farmId)"
            :read-only="isViewer" :today="today" @done="onDone" @remind="onRemind" />
        </div>
      </section>

      <section v-if="shownTips.length && hasPaidPlan" class="mb-6" data-test="week-tips">
        <h2 class="week-section-title">🌱 Поради на цей час</h2>
        <div class="space-y-2">
          <DashboardWeekTipRow v-for="tip in shownTips" :key="tip.id" :tip="tip" :today="today" :read-only="isViewer"
            :farm-names="tip.farmIds.map(id => farmOf(id)?.name).filter(Boolean) as string[]"
            :explanation="tipExplanations[tip.id]" :explaining="tipLoading[tip.id]"
            @explain="onExplain" @remind="onRemindTip" />
        </div>
      </section>
      <div v-else-if="shownTips.length" class="card flex items-center gap-4 py-4 px-5 mb-6" data-test="week-tips-locked">
        <div class="w-11 h-11 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 text-xl">🌱</div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-agro-dark text-sm">Поради на цей час: {{ shownTips.length }}</p>
          <p class="text-xs text-agro-light mt-0.5">Поради за фенофазою й агрокалендарем з поясненням AI — на тарифі Бізнес</p>
        </div>
        <NuxtLink to="/dashboard/subscription" class="dash-btn-primary shrink-0 text-sm whitespace-nowrap">Бізнес →</NuxtLink>
      </div>

      <p class="text-xs text-agro-light mt-8">
        Фаза насадження — відмічена або орієнтовна за сумою активних температур; строки догляду орієнтовні для Центральної України. Звіряйте з тим, що бачите на ділянці.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PlanItem } from '~~/shared/utils/weekPlan'
import type { SeasonTip } from '~~/shared/utils/seasonTips'
import { isPerennialGroup } from '~/utils/cropGroups'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'План на тиждень — АгроПростір' })

const { isViewer } = useTeamContext()
const toast = useToast()
const growthPhases = useGrowthPhases()
const {
  loading, items, farms, crops, today, load, cropOf, farmOf, markCareDone, remind,
  tips, hasPaidPlan, tipExplanations, tipLoading, explainTip, remindTip,
} = useWeekPlan()

const farmFilter = ref('')
const hasPerennials = computed(() => crops.value.some(c => isPerennialGroup(growthPhases.groupForCrop(c.crop_type))))
const farmsWithItems = computed(() => farms.value.filter(f => items.value.some(i => i.farmId === f.id) || tips.value.some(t => t.farmIds.includes(f.id))))
const shownTips = computed(() => tips.value.filter(t => !farmFilter.value || t.farmIds.includes(farmFilter.value)))
const shown = computed(() => items.value.filter(i => !farmFilter.value || i.farmId === farmFilter.value))
const urgent = computed(() => shown.value.filter(i => i.priority === 'high'))
const groups = computed(() => {
  const rest = shown.value.filter(i => i.priority !== 'high')
  const ids = [...new Set(rest.map(i => i.farmId))]
  return ids.map(id => ({ farm: farmOf(id), items: rest.filter(i => i.farmId === id) }))
})

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
}

const onDone = async (item: PlanItem) => {
  if (await markCareDone(item)) toast.success('Відмічено як виконане')
  else toast.error('Не вдалося зберегти')
}
const onRemind = async (item: PlanItem, date: string) => {
  if (await remind(item, date)) toast.success('Нагадування додано')
  else toast.error('Не вдалося додати нагадування')
}

const onExplain = async (tip: SeasonTip) => {
  if (!await explainTip(tip)) toast.error('Не вдалося отримати пояснення')
}
const onRemindTip = async (tip: SeasonTip, date: string) => {
  if (await remindTip(tip, date)) toast.success('Нагадування додано')
  else toast.error('Не вдалося додати нагадування')
}

onMounted(load)
</script>

<style scoped>
.week-section-title {
  font-family: 'Bitter', Georgia, serif;
  font-size: 16px;
  font-weight: 800;
  color: rgb(27, 46, 27);
  margin: 0 0 10px;
}
.week-filter {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(70, 90, 64);
  background: white;
  border: 1px solid rgb(214, 224, 196);
}
.week-filter-on { background: rgb(47, 82, 51); border-color: rgb(47, 82, 51); color: white; }
</style>

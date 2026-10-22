<template>
  <div class="plan-row" :class="item.priority === 'high' ? 'plan-row-high' : ''" :data-kind="item.kind">
    <span class="plan-icon">{{ item.icon }}</span>
    <div class="flex-1 min-w-0">
      <div class="flex items-start gap-2 flex-wrap">
        <p class="font-semibold text-agro-dark text-sm leading-snug">{{ item.title }}</p>
        <span v-if="dateLabel" class="plan-date">{{ dateLabel }}</span>
      </div>
      <p v-if="crop" class="text-xs text-agro font-semibold mt-0.5">
        <template v-if="owner">{{ owner }} · </template>{{ crop.crop_type }}{{ crop.variety ? ` · ${crop.variety}` : '' }}<template v-if="showFarm && farm"> · {{ farm.name }}</template>
      </p>
      <p class="text-xs text-agro-light mt-1 leading-relaxed">{{ item.detail }}</p>

      <div class="flex flex-wrap items-center gap-2 mt-2">
        <button v-if="item.kind === 'care' && !readOnly" type="button" class="plan-btn plan-btn-primary" :disabled="busy" @click="done">
          ✓ Зроблено
        </button>
        <NuxtLink v-if="link && !hideLinks" :to="link.to" class="plan-btn">{{ link.label }}</NuxtLink>
        <slot />
        <template v-if="canRemind">
          <button v-if="!reminding" type="button" class="plan-btn" @click="startRemind">🔔 Нагадати</button>
          <template v-else>
            <input v-model="remindDate" type="date" :min="today" class="plan-date-input" aria-label="Дата нагадування">
            <button type="button" class="plan-btn plan-btn-primary" :disabled="busy || !remindDate" @click="saveRemind">Зберегти</button>
            <button type="button" class="plan-btn" @click="reminding = false">Скасувати</button>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlanItem } from '~~/shared/utils/weekPlan'
import { addDays } from '~~/shared/utils/weatherRisks'

const props = defineProps<{
  item: PlanItem
  crop: { id: string; crop_type: string; variety: string | null } | null
  farm: { id: string; name: string } | null
  today: string
  readOnly?: boolean
  showFarm?: boolean
  /** свої дії замість посилань (кабінет агронома) — через слот */
  hideLinks?: boolean
  /** підпис над культурою, напр. ім'я клієнта */
  owner?: string
}>()
const emit = defineEmits<{ done: [item: PlanItem]; remind: [item: PlanItem, date: string] }>()

const busy = ref(false)
const reminding = ref(false)
const remindDate = ref('')

const ddmm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`
const dateLabel = computed(() => {
  const d = props.item.date
  if (!d) return ''
  if (props.item.kind === 'care') return `до ${ddmm(d)}`
  if (props.item.kind === 'reminder') return d === props.today ? 'сьогодні' : ddmm(d)
  return ''
})

const link = computed(() => {
  const { item, crop } = props
  if (item.kind === 'treatment' && crop) {
    return { to: `/dashboard/protection?farmCropId=${crop.id}&cropType=${encodeURIComponent(crop.crop_type)}`, label: 'Тех. карта →' }
  }
  if (item.kind === 'reminder') return { to: '/dashboard/reminders', label: 'Нагадування →' }
  if (item.kind === 'phase' && item.farmId) return { to: `/dashboard/farm/${item.farmId}`, label: 'Відмітити фазу →' }
  if (item.kind === 'harvest' && crop) return { to: `/dashboard/demand?crop=${encodeURIComponent(crop.crop_type)}`, label: 'Хто купує →' }
  if ((item.kind === 'risk' || item.kind === 'waiting' || item.kind === 'harvest') && item.farmId) return { to: `/dashboard/farm/${item.farmId}`, label: 'До поля →' }
  return null
})
const canRemind = computed(() => !props.readOnly && (props.item.kind === 'care' || props.item.kind === 'treatment' || props.item.kind === 'harvest'))

const startRemind = () => {
  remindDate.value = addDays(props.today, 1)
  reminding.value = true
}
const done = async () => {
  busy.value = true
  emit('done', props.item)
  busy.value = false
}
const saveRemind = () => {
  emit('remind', props.item, remindDate.value)
  reminding.value = false
}
</script>

<style scoped>
.plan-row {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border: 1px solid rgb(226, 232, 214);
  border-radius: 14px;
}
.plan-row-high { background: rgb(254, 246, 246); border-color: rgb(252, 202, 202); }
.plan-icon { font-size: 20px; line-height: 1.2; flex-shrink: 0; }
.plan-date {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 999px;
  color: rgb(70, 90, 64);
  background: rgb(238, 241, 227);
  white-space: nowrap;
}
.plan-btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(47, 82, 51);
  background: white;
  border: 1px solid rgb(214, 224, 196);
}
.plan-btn:hover { background: rgb(238, 241, 227); }
.plan-btn:disabled { opacity: .5; }
.plan-btn-primary { background: rgb(47, 82, 51); border-color: rgb(47, 82, 51); color: white; }
.plan-btn-primary:hover { background: rgb(38, 68, 42); }
.plan-date-input {
  padding: 3px 8px;
  border: 1px solid rgb(214, 224, 196);
  border-radius: 9px;
  font-size: 12px;
  color: rgb(27, 46, 27);
}
</style>

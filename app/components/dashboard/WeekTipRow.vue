<template>
  <div class="tip-row" :data-source="tip.source">
    <div class="tip-icon" :class="`tip-icon-${tip.urgency}`">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="TIP_CATEGORIES[tip.category]?.svg ?? TIP_CATEGORIES.preparation!.svg" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <p class="font-semibold text-agro-dark text-sm leading-snug">{{ tip.title }}</p>
        <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="TIP_URGENCY_BADGE[tip.urgency] ?? TIP_URGENCY_BADGE.low">
          {{ TIP_URGENCY_LABEL[tip.urgency] ?? 'Опційно' }}
        </span>
      </div>
      <p class="text-xs text-agro font-semibold mt-0.5">
        {{ cropLabel }}<template v-if="tip.phase_key"> · фаза «{{ tip.phase_key }}»</template>
      </p>
      <p class="text-xs text-agro-light mt-1 leading-relaxed">{{ tip.description }}</p>

      <div v-if="explanation" class="mt-2 p-2.5 bg-agro-bg rounded-xl text-xs text-agro-dark leading-relaxed">
        <span class="text-agro font-semibold">✦ AI агроном: </span>{{ explanation }}
      </div>
      <p v-else-if="explaining" class="mt-2 text-xs text-agro-light">AI аналізує…</p>

      <div class="flex flex-wrap items-center gap-2 mt-2">
        <button v-if="tip.source === 'calendar' && !explanation && !explaining" type="button" class="plan-btn" @click="emit('explain', tip)">
          Детальніше від AI
        </button>
        <template v-if="!readOnly">
          <button v-if="!reminding" type="button" class="plan-btn" @click="startRemind">🔔 Нагадати</button>
          <template v-else>
            <input v-model="remindDate" type="date" :min="today" class="plan-date-input" aria-label="Дата нагадування">
            <button type="button" class="plan-btn plan-btn-primary" :disabled="!remindDate" @click="saveRemind">Зберегти</button>
            <button type="button" class="plan-btn" @click="reminding = false">Скасувати</button>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SeasonTip } from '~~/shared/utils/seasonTips'
import { addDays } from '~~/shared/utils/weatherRisks'
import { TIP_CATEGORIES, TIP_URGENCY_BADGE, TIP_URGENCY_LABEL } from '~/utils/tipCategories'

const props = defineProps<{
  tip: SeasonTip
  /** назви полів, яких стосується порада */
  farmNames: string[]
  today: string
  explanation?: string
  explaining?: boolean
  readOnly?: boolean
}>()
const emit = defineEmits<{ explain: [tip: SeasonTip]; remind: [tip: SeasonTip, date: string] }>()

const reminding = ref(false)
const remindDate = ref('')

const cropLabel = computed(() => {
  const farms = props.farmNames.length > 2 ? 'кілька полів' : props.farmNames.join(', ')
  return farms ? `${props.tip.crop_type} · ${farms}` : props.tip.crop_type
})

const startRemind = () => {
  remindDate.value = addDays(props.today, 1)
  reminding.value = true
}
const saveRemind = () => {
  emit('remind', props.tip, remindDate.value)
  reminding.value = false
}
</script>

<style scoped>
.tip-row {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border: 1px solid rgb(226, 232, 214);
  border-radius: 14px;
}
.tip-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgb(238, 241, 227);
  color: rgb(47, 82, 51);
}
.tip-icon-high { background: rgb(254, 242, 242); color: rgb(239, 68, 68); }
.tip-icon-medium { background: rgb(255, 251, 235); color: rgb(245, 158, 11); }
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

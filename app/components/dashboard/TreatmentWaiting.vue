<template>
  <div v-if="!readOnly || t.waiting_days != null || t.status === 'done'" class="waiting-row">
    <span v-if="t.status === 'done'" class="inline-flex items-center gap-1">
      Виконано
      <input v-if="!readOnly" type="date" class="waiting-input w-[8.5rem]" :value="t.done_at || ''" :max="today"
        @change="save({ done_at: ($event.target as HTMLInputElement).value || null })" />
      <b v-else-if="t.done_at">{{ fmt(t.done_at) }}</b>
    </span>
    <span class="inline-flex items-center gap-1" title="Строк очікування до збору за етикеткою препарату">
      ⏳ Строк очікування
      <input v-if="!readOnly" type="number" min="0" max="365" inputmode="numeric" class="waiting-input w-14" placeholder="—"
        :value="t.waiting_days ?? ''" @change="saveDays(($event.target as HTMLInputElement).value)" />
      <b v-else>{{ t.waiting_days ?? '—' }}</b>
      дн
    </span>
    <span v-if="from" :class="from > today ? 'text-amber-700 font-semibold' : 'text-green-700'">
      {{ from > today ? `збір не раніше ${fmt(from)}` : `збирати можна з ${fmt(from)}` }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { harvestFrom } from '~~/shared/utils/waitingPeriod'

// Дата виконання і строк очікування обробки; пише одразу в program_treatments
const props = defineProps<{ t: any; readOnly?: boolean }>()
const supabase = useSupabaseClient()
const toast = useToast()
const today = new Date().toLocaleDateString('sv-SE')
const from = computed(() => harvestFrom(props.t))
const fmt = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`

const save = async (patch: Record<string, unknown>) => {
  const prev = { done_at: props.t.done_at, waiting_days: props.t.waiting_days }
  Object.assign(props.t, patch)
  const { error } = await supabase.from('program_treatments').update(patch as never).eq('id', props.t.id)
  if (error) { Object.assign(props.t, prev); toast.error('Не вдалося зберегти: ' + error.message) }
}
const saveDays = (v: string) => {
  const n = v === '' ? null : Math.round(Number(v))
  if (n != null && (!Number.isFinite(n) || n < 0 || n > 365)) { toast.error('Строк очікування — від 0 до 365 днів'); return }
  save({ waiting_days: n })
}
</script>

<style scoped>
.waiting-row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin-top: 4px; font-size: 12px; color: rgb(110, 128, 100); }
.waiting-input { padding: 1px 6px; border: 1px solid rgb(214, 224, 196); border-radius: 6px; background: #fff; font-size: 12px; color: rgb(27, 46, 27); }
</style>

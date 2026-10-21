<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')" />
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto" data-test="plants-modal">
        <div class="px-6 pt-6 pb-4 border-b border-agro-border flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 class="font-extrabold text-agro-dark text-lg">Рослини й квартали</h2>
            <p class="text-sm text-agro-light truncate">{{ crop.crop_type }}{{ crop.variety ? ` · ${crop.variety}` : '' }} · {{ crop.area_ha }} га</p>
          </div>
          <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-bg text-agro-light" aria-label="Закрити" @click="emit('close')">✕</button>
        </div>

        <div class="px-6 py-5 space-y-6">
          <!-- Підсумок -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" data-test="plants-summary">
            <div class="pm-tile"><p class="pm-label">Висаджено</p><p class="pm-num">{{ fmt(count.planted) }}</p></div>
            <div class="pm-tile"><p class="pm-label">Випало</p><p class="pm-num text-red-700">{{ fmt(count.lost) }}<span v-if="count.lossPct" class="pm-sub"> · {{ pct(count.lossPct) }}</span></p></div>
            <div class="pm-tile"><p class="pm-label">Підсаджено</p><p class="pm-num">{{ fmt(count.replanted) }}</p></div>
            <div class="pm-tile pm-tile-main"><p class="pm-label">Живих зараз</p><p class="pm-num" data-test="plants-alive">{{ fmt(count.alive) }}</p></div>
          </div>
          <p v-if="!count.planted && !blocks.length" class="text-sm text-agro-light -mt-3">
            Кількість рослин не вказана — додайте квартали або впишіть її в параметрах насадження (кнопка «Редагувати культуру»).
          </p>
          <div v-if="count.mismatch" class="pm-note">
            У кварталах {{ fmt(blocksTotal) }} рослин, а в параметрах насадження — {{ fmt(crop.plants_count) }}. Рахуємо за кварталами.
            <button v-if="!readOnly" type="button" class="pm-link" :disabled="busy" @click="syncCropCount">Записати {{ fmt(blocksTotal) }} у насадження</button>
          </div>

          <!-- Квартали -->
          <section>
            <div class="flex items-center justify-between gap-3 mb-2">
              <h3 class="pm-h">Квартали</h3>
              <button v-if="!readOnly && !blockForm.open" type="button" class="pm-btn" data-test="block-add" @click="editBlock(null)">+ Квартал</button>
            </div>
            <p v-if="!blocks.length && !blockForm.open" class="text-sm text-agro-light">
              Поділіть насадження на квартали чи групи рядів, щоб бачити випади по кожному. Необов'язково — облік працює й без них.
            </p>
            <div v-if="count.byBlock.length" class="space-y-1.5">
              <div v-for="b in count.byBlock" :key="b.block.id" class="pm-row" data-test="block-row">
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-agro-dark text-sm">{{ b.block.name }}<span v-if="blockRows(b.block)" class="text-agro-light font-normal"> · {{ blockRows(b.block) }}</span></p>
                  <p class="text-xs text-agro-light">
                    {{ fmt(b.block.plants_count) }} висаджено<template v-if="b.lost"> · −{{ fmt(b.lost) }}</template><template v-if="b.replanted"> · +{{ fmt(b.replanted) }}</template>
                    · <b class="text-agro-dark">{{ fmt(b.alive) }} живих</b>
                  </p>
                </div>
                <template v-if="!readOnly">
                  <button type="button" class="pm-link" @click="editBlock(b.block)">змінити</button>
                  <button type="button" class="pm-link text-red-600" :aria-label="`Видалити ${b.block.name}`" @click="deleteBlock(b.block)">✕</button>
                </template>
              </div>
            </div>
            <form v-if="blockForm.open" class="pm-form mt-2" data-test="block-form" @submit.prevent="saveBlock">
              <label class="col-span-2 sm:col-span-1"><span class="pm-label">Назва</span>
                <input v-model="blockForm.name" class="input" maxlength="60" placeholder="Квартал 1" required data-test="block-name"></label>
              <label><span class="pm-label">Ряди з</span>
                <input v-model="blockForm.rows_from" class="input" type="number" min="1" inputmode="numeric" placeholder="1"></label>
              <label><span class="pm-label">по</span>
                <input v-model="blockForm.rows_to" class="input" type="number" min="1" inputmode="numeric" placeholder="20"></label>
              <label><span class="pm-label">Рослин</span>
                <input v-model="blockForm.plants_count" class="input" type="number" min="0" inputmode="numeric" placeholder="2000" required data-test="block-plants"></label>
              <div class="col-span-2 sm:col-span-4 flex gap-2 justify-end">
                <button type="button" class="pm-btn" @click="blockForm.open = false">Скасувати</button>
                <button type="submit" class="pm-btn pm-btn-primary" :disabled="busy">Зберегти</button>
              </div>
            </form>
          </section>

          <!-- Випади й підсадка -->
          <section>
            <h3 class="pm-h mb-2">Випади й підсадка</h3>
            <form v-if="!readOnly" class="pm-form" data-test="event-form" @submit.prevent="saveEvent">
              <div class="col-span-2 sm:col-span-4 flex gap-1.5" role="group" aria-label="Що сталося">
                <button type="button" class="pm-seg" :aria-pressed="ev.kind === 'loss'" @click="ev.kind = 'loss'">Випали</button>
                <button type="button" class="pm-seg" :aria-pressed="ev.kind === 'replant'" @click="ev.kind = 'replant'">Підсадили</button>
              </div>
              <label><span class="pm-label">Дата</span>
                <input v-model="ev.event_date" class="input" type="date" :max="today" required></label>
              <label><span class="pm-label">Рослин</span>
                <input v-model="ev.count" class="input" type="number" min="1" inputmode="numeric" required data-test="event-count"></label>
              <label v-if="blocks.length"><span class="pm-label">Квартал</span>
                <select v-model="ev.block_id" class="input" data-test="event-block">
                  <option value="">— увесь</option>
                  <option v-for="b in blocks" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select></label>
              <label v-if="ev.kind === 'loss'"><span class="pm-label">Причина</span>
                <select v-model="ev.reason" class="input" data-test="event-reason">
                  <option value="">—</option>
                  <option v-for="(label, key) in LOSS_REASONS" :key="key" :value="key">{{ label }}</option>
                </select></label>
              <label class="col-span-2 sm:col-span-4"><span class="pm-label">Нотатка</span>
                <input v-model="ev.note" class="input" maxlength="300" placeholder="Напр. після морозу −28 °C, ряди 3–5"></label>
              <div class="col-span-2 sm:col-span-4 flex justify-end">
                <button type="submit" class="pm-btn pm-btn-primary" :disabled="busy || !(Number(ev.count) > 0)" data-test="event-save">Записати</button>
              </div>
            </form>
            <div v-if="events.length" class="mt-3 space-y-1">
              <div v-for="e in events" :key="e.id" class="pm-row" data-test="event-row">
                <span class="pm-date">{{ ddmmyyyy(e.event_date) }}</span>
                <span class="font-semibold text-sm" :class="e.kind === 'loss' ? 'text-red-700' : 'text-agro'">{{ e.kind === 'loss' ? '−' : '+' }}{{ fmt(e.count) }}</span>
                <span class="text-xs text-agro-light flex-1 min-w-0">
                  {{ [blocks.find(b => b.id === e.block_id)?.name, e.reason ? LOSS_REASONS[e.reason] : '', e.note].filter(Boolean).join(' · ') }}
                </span>
                <button v-if="!readOnly" type="button" class="pm-link text-red-600" aria-label="Видалити запис" @click="deleteEvent(e)">✕</button>
              </div>
            </div>
            <p v-else class="text-sm text-agro-light mt-2">Записів ще немає.</p>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { blockRows, LOSS_REASONS, plantCount, type PlantBlock, type PlantEvent } from '~~/shared/utils/plantCount'

const props = defineProps<{
  crop: { id: string; crop_type: string; variety: string | null; area_ha: number | string | null; plants_count: number | null }
  readOnly?: boolean
}>()
const emit = defineEmits<{ close: []; changed: [] }>()
const supabase = useSupabaseClient() as any
const toast = useToast()
const today = new Date().toLocaleDateString('sv-SE')

const blocks = ref<(PlantBlock & { note?: string | null })[]>([])
const events = ref<(PlantEvent & { id: string; note?: string | null })[]>([])
const busy = ref(false)
const count = computed(() => plantCount(props.crop.plants_count, blocks.value, events.value))
const blocksTotal = computed(() => blocks.value.reduce((s, b) => s + (b.plants_count || 0), 0))

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('uk-UA')
const pct = (n: number) => `${String(n).replace('.', ',')}%`
const ddmmyyyy = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`

const load = async () => {
  const [b, e] = await Promise.all([
    supabase.from('planting_blocks').select('id, name, rows_from, rows_to, plants_count, note').eq('farm_crop_id', props.crop.id).order('sort_order').order('name'),
    supabase.from('planting_plant_events').select('id, block_id, event_date, kind, count, reason, note').eq('farm_crop_id', props.crop.id)
      .order('event_date', { ascending: false }).order('created_at', { ascending: false }),
  ])
  blocks.value = b.data || []
  events.value = e.data || []
}
onMounted(load)

const done = async (error: any, ok: string) => {
  busy.value = false
  if (error) { toast.error(error.code === '23505' ? 'Квартал з такою назвою вже є' : 'Не вдалося зберегти'); return false }
  toast.success(ok)
  await load()
  emit('changed')
  return true
}

// ── Квартали ──
const blockForm = reactive({ open: false, id: '' as string, name: '', rows_from: '', rows_to: '', plants_count: '' })
const editBlock = (b: PlantBlock | null) => {
  Object.assign(blockForm, b
    ? { open: true, id: b.id, name: b.name, rows_from: b.rows_from ? String(b.rows_from) : '', rows_to: b.rows_to ? String(b.rows_to) : '', plants_count: String(b.plants_count) }
    : { open: true, id: '', name: `Квартал ${blocks.value.length + 1}`, rows_from: '', rows_to: '', plants_count: '' })
}
const int = (s: string) => { const n = parseInt(s, 10); return Number.isFinite(n) && n > 0 ? n : null }
const saveBlock = async () => {
  const from = int(blockForm.rows_from), to = int(blockForm.rows_to)
  const row = {
    name: blockForm.name.trim(), rows_from: from, rows_to: to && from && to < from ? from : to,
    plants_count: Math.max(0, parseInt(blockForm.plants_count, 10) || 0),
  }
  if (!row.name) return
  busy.value = true
  const { error } = blockForm.id
    ? await supabase.from('planting_blocks').update(row).eq('id', blockForm.id)
    : await supabase.from('planting_blocks').insert({ ...row, farm_crop_id: props.crop.id, sort_order: blocks.value.length })
  if (await done(error, 'Квартал збережено')) blockForm.open = false
}
const deleteBlock = async (b: PlantBlock) => {
  busy.value = true
  const { error } = await supabase.from('planting_blocks').delete().eq('id', b.id)
  await done(error, `«${b.name}» видалено; записи про випади лишились без кварталу`)
}
const syncCropCount = async () => {
  busy.value = true
  const { error } = await supabase.from('farm_crops').update({ plants_count: blocksTotal.value }).eq('id', props.crop.id)
  await done(error, 'Кількість рослин у насадженні оновлено')
}

// ── Випади й підсадка ──
const ev = reactive({ kind: 'loss' as 'loss' | 'replant', event_date: today, count: '', block_id: '', reason: '', note: '' })
const saveEvent = async () => {
  const n = parseInt(ev.count, 10)
  if (!(n > 0)) return
  busy.value = true
  const { error } = await supabase.from('planting_plant_events').insert({
    farm_crop_id: props.crop.id, kind: ev.kind, event_date: ev.event_date || today, count: n,
    block_id: ev.block_id || null, reason: ev.kind === 'loss' ? ev.reason || null : null, note: ev.note.trim() || null,
  })
  if (await done(error, ev.kind === 'loss' ? 'Випад записано' : 'Підсадку записано')) Object.assign(ev, { count: '', note: '' })
}
const deleteEvent = async (e: { id: string }) => {
  busy.value = true
  const { error } = await supabase.from('planting_plant_events').delete().eq('id', e.id)
  await done(error, 'Запис видалено')
}
</script>

<style scoped>
.pm-tile { border: 1px solid rgb(226, 232, 214); border-radius: 12px; padding: 10px 12px; background: rgb(248, 250, 244); }
.pm-tile-main { background: rgb(238, 241, 227); border-color: rgb(205, 218, 186); }
.pm-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgb(110, 128, 100); margin-bottom: 2px; }
.pm-num { font-family: 'Bitter', Georgia, serif; font-size: 20px; font-weight: 800; color: rgb(27, 46, 27); font-variant-numeric: tabular-nums; }
.pm-sub { font-family: inherit; font-size: 12px; font-weight: 600; color: rgb(110, 128, 100); }
.pm-h { font-family: 'Bitter', Georgia, serif; font-size: 15px; font-weight: 800; color: rgb(27, 46, 27); }
.pm-note { font-size: 13px; color: rgb(120, 80, 20); background: rgb(253, 246, 232); border: 1px solid rgb(240, 222, 186); border-radius: 10px; padding: 8px 12px; }
.pm-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid rgb(232, 237, 222); border-radius: 10px; }
.pm-date { font-size: 12px; color: rgb(110, 128, 100); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pm-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 12px; border: 1px solid rgb(226, 232, 214); border-radius: 12px; background: rgb(248, 250, 244); }
@media (min-width: 640px) { .pm-form { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.pm-btn { padding: 5px 12px; border-radius: 9px; font-size: 13px; font-weight: 600; color: rgb(47, 82, 51); background: white; border: 1px solid rgb(214, 224, 196); }
.pm-btn:hover { background: rgb(238, 241, 227); }
.pm-btn:disabled { opacity: .5; }
.pm-btn-primary { background: rgb(47, 82, 51); border-color: rgb(47, 82, 51); color: white; }
.pm-btn-primary:hover { background: rgb(38, 68, 42); }
.pm-link { font-size: 12px; font-weight: 600; color: rgb(47, 82, 51); padding: 2px 4px; }
.pm-link:hover { text-decoration: underline; }
.pm-seg { padding: 5px 14px; border-radius: 9px; font-size: 13px; font-weight: 600; color: rgb(70, 90, 64); background: white; border: 1px solid rgb(214, 224, 196); }
.pm-seg[aria-pressed="true"] { background: rgb(47, 82, 51); border-color: rgb(47, 82, 51); color: white; }
</style>

<template>
  <div class="bg-agro-bg rounded-2xl p-3">
    <div class="flex items-center justify-between mb-3">
      <button type="button" @click="shift(-1)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold" aria-label="Попередній місяць">‹</button>
      <span class="font-semibold text-agro-dark text-sm">{{ MONTHS[month] }} {{ year }} р.</span>
      <button type="button" @click="shift(1)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold" aria-label="Наступний місяць">›</button>
    </div>
    <div class="grid grid-cols-7 mb-1">
      <div v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d" class="text-center text-xs font-medium text-agro-light py-1">{{ d }}</div>
    </div>
    <div class="grid grid-cols-7 gap-0.5">
      <div v-for="blank in firstDayOffset" :key="'b' + blank" />
      <button v-for="day in daysInMonth" :key="day" type="button" :disabled="isOff(day)"
        @click="emit('update:modelValue', iso(day))"
        class="aspect-square flex items-center justify-center text-sm rounded-xl transition-colors font-medium"
        :class="[
          iso(day) === modelValue ? 'bg-agro text-white' : isOff(day) ? 'text-agro-light/40 cursor-not-allowed' : 'hover:bg-white text-agro-dark',
          iso(day) === today && iso(day) !== modelValue ? 'text-agro font-bold' : '',
        ]"
      >{{ day }}</button>
    </div>
    <p v-if="modelValue" class="text-xs text-agro mt-2 font-medium text-center">📅 {{ label }}</p>
  </div>
</template>

<script setup lang="ts">
// Вбудований календар у стилі кабінету (як у формах обробок і нагадувань); значення — 'YYYY-MM-DD'
const props = defineProps<{ modelValue: string; min?: string; max?: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
const MONTHS_GEN = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
const today = new Date().toLocaleDateString('sv-SE')

const start = () => { const d = props.modelValue ? new Date(props.modelValue + 'T00:00') : new Date(); return { m: d.getMonth(), y: d.getFullYear() } }
const month = ref(start().m)
const year = ref(start().y)
// Значення може прийти пізніше (завантаження акта) — показуємо його місяць
watch(() => props.modelValue, () => { const s = start(); month.value = s.m; year.value = s.y })

const firstDayOffset = computed(() => { const d = new Date(year.value, month.value, 1).getDay(); return d === 0 ? 6 : d - 1 })
const daysInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate())
const iso = (day: number) => `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
const isOff = (day: number) => (!!props.min && iso(day) < props.min) || (!!props.max && iso(day) > props.max)
const shift = (n: number) => { const d = new Date(year.value, month.value + n, 1); month.value = d.getMonth(); year.value = d.getFullYear() }
const label = computed(() => { const [y, m, d] = props.modelValue.split('-').map(Number); return `${d} ${MONTHS_GEN[m - 1]} ${y}` })
</script>

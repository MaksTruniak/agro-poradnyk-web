<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" data-test="tank-mix-modal" @click.self="emit('close')">
      <div class="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div class="px-6 pt-5 pb-4 border-b border-agro-border flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-agro-light">Робочий розчин</p>
            <h3 class="font-bold text-agro-dark text-lg leading-snug">{{ product }}</h3>
            <p class="text-xs text-agro-light mt-0.5">Норма за техкартою: <b class="text-agro-dark">{{ dosage }}</b></p>
          </div>
          <button type="button" class="w-8 h-8 rounded-lg hover:bg-agro-hover text-agro-light" aria-label="Закрити" @click="emit('close')">✕</button>
        </div>

        <div class="px-6 py-5 space-y-4">
          <label v-if="dose.kind === 'per_ha'" class="flex items-center gap-2 text-sm text-agro-dark cursor-pointer">
            <input v-model="spray" type="checkbox" class="accent-agro" data-test="tm-spray">
            Розчином (обприскування, фертигація)
          </label>
          <div class="grid gap-3" :class="dose.kind === 'per_plant' ? 'grid-cols-1' : spray ? 'grid-cols-3' : 'grid-cols-1'">
            <label v-if="dose.kind === 'per_plant'" class="block">
              <span class="tm-label">Рослин, шт</span>
              <input v-model.number="plants" type="number" min="1" inputmode="numeric" class="input" data-test="tm-plants">
            </label>
            <template v-else>
              <label class="block">
                <span class="tm-label">Площа, га</span>
                <input v-model.number="area" type="number" min="0" step="0.01" inputmode="decimal" class="input" data-test="tm-area">
              </label>
              <label v-if="spray" class="block">
                <span class="tm-label">Розчину, л/га</span>
                <input v-model.number="water" type="number" min="1" step="10" inputmode="numeric" class="input" data-test="tm-water">
              </label>
              <label v-if="spray" class="block">
                <span class="tm-label">Бак, л</span>
                <input v-model.number="tank" type="number" min="1" step="10" inputmode="numeric" class="input" data-test="tm-tank">
              </label>
            </template>
          </div>
          <p v-if="dose.kind !== 'per_plant' && spray" class="text-xs text-agro-light -mt-2">{{ waterHint }}</p>

          <div v-if="mix" class="tm-result" data-test="tm-result">
            <template v-if="dose.kind === 'per_plant'">
              <p class="tm-big">{{ formatAmount(mix.product, mix.unit) }}</p>
              <p class="text-sm text-agro-light">на {{ plants }} рослин ({{ dosage }})</p>
            </template>
            <template v-else-if="!spray">
              <p class="tm-label">Внести всього</p>
              <p class="tm-big" data-test="tm-total">{{ formatAmount(mix.product, mix.unit) }}</p>
              <p v-if="perPlant" class="text-sm text-agro-light mt-1">≈ {{ perPlant }} на рослину ({{ plantsCount }} шт)</p>
            </template>
            <template v-else>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="tm-label">Препарату всього</p>
                  <p class="tm-big" data-test="tm-total">{{ formatAmount(mix.product, mix.unit) }}</p>
                </div>
                <div>
                  <p class="tm-label">Розчину всього</p>
                  <p class="tm-big">{{ litres(mix.water!) }}</p>
                </div>
              </div>
              <div class="border-t border-agro-border mt-3 pt-3 space-y-1.5 text-sm text-agro-dark">
                <p v-if="mix.perTank" data-test="tm-per-tank">
                  🛢️ <b>{{ fullTanks }} {{ plural(fullTanks, 'повна заправка', 'повні заправки', 'повних заправок') }}</b>
                  по {{ litres(tank) }} — <b>{{ formatAmount(mix.perTank, mix.unit) }}</b> препарату в кожну
                </p>
                <p v-if="mix.lastTank" data-test="tm-last-tank">
                  🪣 {{ mix.perTank ? 'Остання' : 'Одна' }} заправка — <b>{{ litres(mix.lastTank.water) }}</b> розчину,
                  <b>{{ formatAmount(mix.lastTank.product, mix.unit) }}</b> препарату
                </p>
              </div>
            </template>
          </div>
          <p v-else class="text-sm text-agro-light">Вкажіть {{ dose.kind === 'per_plant' ? 'кількість рослин' : 'площу, витрату розчину й об’єм бака' }}.</p>

          <p class="text-xs text-agro-light leading-relaxed">
            Звіряйте норму й витрату розчину з етикеткою препарату. Налийте в бак половину води, додайте препарат (попередньо
            розведений), перемішайте й долийте до потрібного об’єму.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { defaultWaterPerHa, formatAmount, parseDosage, tankMix, type Dose } from '~~/shared/utils/tankMix'

const props = defineProps<{
  product: string
  dosage: string
  areaHa: number | null
  plantsCount: number | null
  group: string | null
}>()
const emit = defineEmits<{ close: [] }>()

const TANK_KEY = 'agro_tank_l'
const dose = computed(() => parseDosage(props.dosage) as Dose)
const area = ref<number>(props.areaHa ?? 1)
const plants = ref<number | null>(props.plantsCount)
const water = ref<number>(dose.value?.kind === 'per_ha' && dose.value.waterPerHa ? dose.value.waterPerHa : defaultWaterPerHa(props.group))
const tank = ref<number>(400)
onMounted(() => {
  try {
    const saved = Number(localStorage.getItem(TANK_KEY))
    if (saved > 0) tank.value = saved
  } catch {}
})
watch(tank, v => {
  try { if (v > 0) localStorage.setItem(TANK_KEY, String(v)) } catch {}
})

// Великі норми сухих добрив (≥ 20 кг/га) зазвичай вносять у ґрунт — тоді рахуємо лише загальну кількість
const spray = ref(!(dose.value?.kind === 'per_ha' && dose.value.unit === 'кг' && dose.value.amount >= 20 && !dose.value.waterPerHa))
const waterHint = computed(() => dose.value?.kind === 'per_ha' && dose.value.waterPerHa
  ? `Витрата розчину — з техкарти (${dose.value.waterPerHa} л/га).`
  : 'Типова витрата для цієї культури; уточніть за етикеткою і вашим обприскувачем.')

const mix = computed(() => {
  const d = dose.value
  if (d.kind === 'per_ha' && !spray.value) {
    return area.value > 0 ? { product: [d.amount * area.value, d.amountMax * area.value] as [number, number], unit: d.unit, water: null, tanks: 0, perTank: null, lastTank: null } : null
  }
  return tankMix({ dose: d, areaHa: area.value, waterPerHa: water.value, tankL: tank.value, plants: plants.value })
})
const perPlant = computed(() => {
  const m = mix.value
  if (!m || !props.plantsCount || !props.areaHa || Math.abs(area.value - props.areaHa) > 1e-9) return ''
  return formatAmount([m.product[0] / props.plantsCount, m.product[1] / props.plantsCount], m.unit)
})
const fullTanks = computed(() => mix.value ? (mix.value.lastTank ? mix.value.tanks - 1 : mix.value.tanks) : 0)

const litres = (v: number) => `${Number(v.toFixed(v >= 100 ? 0 : 1)).toLocaleString('uk-UA')} л`
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
}
</script>

<style scoped>
.tm-label { display: block; font-size: 12px; font-weight: 600; color: rgb(91, 107, 83); margin-bottom: 4px; }
.tm-big { font-family: 'Bitter', Georgia, serif; font-size: 22px; font-weight: 800; color: rgb(27, 46, 27); line-height: 1.2; }
.tm-result { background: rgb(246, 248, 240); border: 1px solid rgb(226, 232, 214); border-radius: 16px; padding: 14px 16px; }
</style>

<template>
  <div class="planting-box">
    <p class="planting-title">Насадження</p>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="planting-label">Рік посадки</label>
        <input v-model="form.planting_year" class="input" type="number" min="1900" :max="thisYear" :placeholder="String(thisYear)" inputmode="numeric" />
      </div>
      <div>
        <label class="planting-label">Підщепа</label>
        <input v-model="form.rootstock" class="input" maxlength="100" placeholder="Напр. М9" />
      </div>
      <div>
        <label class="planting-label">Міжряддя, м</label>
        <input v-model="form.row_spacing_m" class="input" placeholder="3.0" inputmode="decimal" @input="form.row_spacing_m = form.row_spacing_m.replace(',', '.')" />
      </div>
      <div>
        <label class="planting-label">У ряду, м</label>
        <input v-model="form.plant_spacing_m" class="input" placeholder="1.0" inputmode="decimal" @input="form.plant_spacing_m = form.plant_spacing_m.replace(',', '.')" />
      </div>
      <div>
        <label class="planting-label">Кількість рослин</label>
        <input v-model="form.plants_count" class="input" type="number" min="0" :placeholder="autoCount ? String(autoCount) : '—'" inputmode="numeric" />
        <p v-if="autoCount && !form.plants_count" class="text-[11px] text-agro-light mt-1">≈ {{ autoCount.toLocaleString('uk-UA') }} за схемою</p>
      </div>
      <div>
        <label class="planting-label">Зрошення</label>
        <UiAppSelect v-model="form.irrigation" :options="IRRIGATION_OPTIONS" />
      </div>
      <div v-if="showTrellis" class="col-span-2">
        <label class="planting-label">Шпалера</label>
        <input v-model="form.trellis" class="input" maxlength="100" placeholder="Напр. одноплощинна, V-подібна" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IRRIGATION_OPTIONS, plantsFromScheme, type PlantingForm } from '~/utils/planting'

const props = defineProps<{ areaHa?: number | string | null; group?: string | null }>()
const form = defineModel<PlantingForm>({ required: true })

const thisYear = new Date().getFullYear()
// Шпалера — для винограду, ягідних кущів і садів; полуниці не потрібна
const showTrellis = computed(() => props.group !== 'berry_herb')
const autoCount = computed(() => plantsFromScheme(
  parseFloat(String(props.areaHa ?? '')) || null,
  parseFloat(form.value.row_spacing_m) || null,
  parseFloat(form.value.plant_spacing_m) || null,
))
</script>

<style scoped>
.planting-box {
  border: 1px solid rgb(226, 232, 214);
  border-radius: 14px;
  padding: 14px;
  background: rgb(248, 250, 244);
}
.planting-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgb(47, 82, 51);
  margin-bottom: 10px;
}
.planting-label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: rgb(27, 46, 27);
  margin-bottom: 4px;
}
</style>

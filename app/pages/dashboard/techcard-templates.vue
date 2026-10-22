<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="8" y="3" width="13" height="15" rx="2" /><path d="M16 21H5a2 2 0 01-2-2V7" /><path d="M12 8h5M12 12h5" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Шаблони техкарт</h1>
        <p class="dash-subtitle">Ваші схеми обробок — застосовуйте до культур клієнтів у техкарті</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-3"><div v-for="i in 3" :key="i" class="card animate-pulse h-20" /></div>

    <div v-else-if="!templates.length" class="card text-center py-14">
      <p class="text-3xl mb-2">📋</p>
      <p class="font-bold text-agro-dark text-lg mb-2">Шаблонів ще немає</p>
      <p class="text-agro-light text-sm max-w-md mx-auto">
        Складіть техкарту для однієї культури клієнта й натисніть «💾 Зберегти як шаблон». Потім у техкарті іншого клієнта —
        «📋 Застосувати шаблон», і всі обробки за фазами з'являться одним натиском.
      </p>
    </div>

    <div v-else class="space-y-3 max-w-3xl">
      <div v-for="t in templates" :key="t.id" class="card" data-test="tpl-card">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[200px]">
            <input v-if="editing === t.id" v-model="editName" class="input text-sm" maxlength="120" data-test="tpl-rename-input" @keyup.enter="rename(t)">
            <p v-else class="font-semibold text-agro-dark">{{ t.name }}</p>
            <p class="text-xs text-agro-light mt-0.5">
              {{ t.crop_type || 'будь-яка культура' }} · {{ t.items.length }} {{ plural(t.items.length, 'обробка', 'обробки', 'обробок') }}
              · змінено {{ dmy(t.updated_at) }}
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <template v-if="editing === t.id">
              <button type="button" class="btn-primary text-sm" :disabled="!editName.trim()" data-test="tpl-rename-save" @click="rename(t)">Зберегти</button>
              <button type="button" class="btn-outline text-sm" @click="editing = ''">Скасувати</button>
            </template>
            <template v-else>
              <button type="button" class="btn-outline text-sm" @click="open[t.id] = !open[t.id]">{{ open[t.id] ? 'Згорнути' : 'Обробки' }}</button>
              <button type="button" class="btn-outline text-sm" data-test="tpl-rename" @click="editing = t.id; editName = t.name">Перейменувати</button>
              <button type="button" class="btn-outline text-sm text-red-500" data-test="tpl-delete" @click="remove(t)">Видалити</button>
            </template>
          </div>
        </div>
        <div v-if="open[t.id]" class="mt-4 space-y-3">
          <div v-for="g in groups(t)" :key="g.phase">
            <p class="text-xs font-bold text-agro-dark uppercase tracking-wide mb-1">{{ g.phase }}</p>
            <ul class="space-y-1">
              <li v-for="(i, n) in g.items" :key="n" class="text-sm">
                <span class="text-agro-light">{{ i.type }}</span> · <b class="text-agro-dark">{{ i.product_name }}</b>
                <template v-if="i.dosage"> · {{ i.dosage }}</template>
                <template v-if="i.waiting_days != null"> · строк очікування {{ i.waiting_days }} дн.</template>
                <span v-if="i.notes" class="block text-xs text-agro-light italic">{{ i.notes }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p class="text-xs text-agro-light">Шаблони бачите лише ви. Застосувати шаблон — на сторінці техкарти культури.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TemplateItem } from '~~/shared/utils/techcardTemplate'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Шаблони техкарт — АгроПростір' })

const supabase = useSupabaseClient() as any
const toast = useToast()
const { confirm } = useConfirm()

const loading = ref(true)
const templates = ref<any[]>([])
const open = reactive<Record<string, boolean>>({})
const editing = ref('')
const editName = ref('')

const dmy = (iso: string) => iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : ''
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
}
const groups = (t: any) => {
  const map = new Map<string, TemplateItem[]>()
  for (const i of t.items as TemplateItem[]) {
    const k = i.phase || 'Без фази'
    map.set(k, [...(map.get(k) || []), i])
  }
  return [...map].map(([phase, items]) => ({ phase, items }))
}

const load = async () => {
  const { data } = await supabase.from('techcard_templates').select('id, name, crop_type, items, updated_at').order('updated_at', { ascending: false })
  templates.value = data || []
  loading.value = false
}

const rename = async (t: any) => {
  const name = editName.value.trim()
  if (!name) return
  const { error } = await supabase.from('techcard_templates').update({ name }).eq('id', t.id)
  if (error) { toast.error('Не вдалося перейменувати'); return }
  editing.value = ''
  await load()
}

const remove = async (t: any) => {
  if (!await confirm(`Шаблон «${t.name}» буде видалено. Техкарти, до яких його вже застосували, не зміняться.`, { title: 'Видалити шаблон?' })) return
  const { error } = await supabase.from('techcard_templates').delete().eq('id', t.id)
  if (error) { toast.error('Не вдалося видалити'); return }
  templates.value = templates.value.filter(x => x.id !== t.id)
}

onMounted(load)
</script>

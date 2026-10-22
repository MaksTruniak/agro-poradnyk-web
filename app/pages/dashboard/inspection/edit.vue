<template>
  <div class="dash-page">
    <div class="dash-head">
      <button type="button" class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors" aria-label="Назад" @click="router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">{{ form.id ? 'Акт огляду' : 'Новий акт огляду' }}</h1>
        <p class="dash-subtitle truncate">{{ crop ? `${crop.crop_type}${crop.variety ? ` · ${crop.variety}` : ''} · ${crop.farm_name} · ${clientName}` : '…' }}</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-3"><div v-for="i in 3" :key="i" class="card animate-pulse h-24" /></div>

    <div v-else-if="!crop" class="card text-center py-12">
      <p class="font-bold text-agro-dark mb-2">Насадження недоступне</p>
      <p class="text-sm text-agro-light">Акт може скласти агроном з активною співпрацею з господарем поля.</p>
    </div>

    <form v-else class="space-y-5 max-w-3xl" data-test="inspection-form" @submit.prevent="save(false)">
      <!-- Огляд -->
      <section class="card space-y-4">
        <div class="grid sm:grid-cols-2 gap-3">
          <label class="block"><span class="ins-label">Дата огляду</span>
            <input v-model="form.visited_at" type="date" class="input" :max="today" required data-test="ins-date"></label>
          <label class="block"><span class="ins-label">Фенофаза на час огляду</span>
            <select v-model="form.phase_key" class="input" data-test="ins-phase">
              <option value="">— не вказувати</option>
              <option v-for="p in phaseOptions" :key="p" :value="p">{{ p }}{{ p === currentPhase ? ' (у журналі)' : '' }}</option>
            </select></label>
        </div>
        <div>
          <span class="ins-label">Загальний стан</span>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Загальний стан">
            <button v-for="(label, key) in CONDITIONS" :key="key" type="button" class="ins-seg" :data-cond="key" :aria-pressed="form.condition === key"
              @click="form.condition = key">{{ label }}</button>
          </div>
        </div>
      </section>

      <!-- Знахідки -->
      <section class="card">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h2 class="ins-h">Що знайдено</h2>
          <button type="button" class="ins-btn" data-test="ins-add-finding" @click="addFinding">+ Знахідка</button>
        </div>
        <p v-if="!form.findings.length" class="text-sm text-agro-light">Без проблем — або додайте хворобу, шкідника, бур'ян чи ознаки нестачі живлення.</p>
        <div class="space-y-3">
          <div v-for="(f, i) in form.findings" :key="f.key" class="ins-item" data-test="ins-finding">
            <div class="grid sm:grid-cols-[150px_minmax(0,1fr)] gap-2">
              <select v-model="f.kind" class="input" aria-label="Що саме">
                <option v-for="(label, key) in KINDS" :key="key" :value="key">{{ label }}</option>
              </select>
              <input v-model="f.name" class="input" maxlength="160" :list="`cat-${f.kind}`" placeholder="Назва, напр. Антракноз" required data-test="ins-finding-name">
            </div>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <div class="flex gap-1" role="group" aria-label="Ступінь">
                <button v-for="(label, key) in SEVERITY" :key="key" type="button" class="ins-seg ins-seg-sm" :aria-pressed="f.severity === key" @click="f.severity = key">{{ label }}</button>
              </div>
              <label class="flex items-center gap-1.5 text-xs text-agro-light">уражено
                <input v-model="f.affected_pct" type="number" min="0" max="100" class="input ins-pct" inputmode="numeric" placeholder="—">%</label>
              <button type="button" class="ins-link text-red-600 ml-auto" @click="form.findings.splice(i, 1)">Прибрати</button>
            </div>
            <textarea v-model="f.note" class="input mt-2" rows="2" maxlength="1000" placeholder="Де і як проявляється, які ряди чи квартали" />
            <div class="flex flex-wrap gap-2 mt-2">
              <div v-for="(ph, j) in f.photos" :key="ph.key" class="ins-photo">
                <img :src="ph.url" alt="Фото знахідки">
                <button type="button" class="ins-photo-x" aria-label="Прибрати фото" @click="f.photos.splice(j, 1)">✕</button>
              </div>
              <label v-if="f.photos.length < 6" class="ins-photo ins-photo-add">
                <input type="file" accept="image/*" multiple class="sr-only" data-test="ins-photo-input" @change="addPhotos(f, $event)">
                📷 Фото
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Рекомендації -->
      <section class="card">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h2 class="ins-h">Рекомендації</h2>
          <button type="button" class="ins-btn" data-test="ins-add-rec" @click="addRec">+ Рекомендація</button>
        </div>
        <p v-if="!form.recs.length" class="text-sm text-agro-light">Обробки, підживлення, полив чи роботи з догляду. Обробки можна одразу внести в техкарту клієнта.</p>
        <div class="space-y-3">
          <div v-for="(r, i) in form.recs" :key="r.key" class="ins-item" data-test="ins-rec">
            <div class="grid sm:grid-cols-[150px_minmax(0,1fr)_140px] gap-2">
              <select v-model="r.type" class="input" aria-label="Тип">
                <option v-for="t in REC_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
              <input v-model="r.product_name" class="input" maxlength="200" placeholder="Препарат або що зробити" required data-test="ins-rec-product">
              <input v-model="r.dosage" class="input" maxlength="100" placeholder="Норма, напр. 1 кг/га" data-test="ins-rec-dosage">
            </div>
            <div class="flex flex-wrap items-center gap-3 mt-2">
              <label class="flex items-center gap-1.5 text-xs text-agro-light">до
                <input v-model="r.due_date" type="date" class="input ins-date" :min="form.visited_at"></label>
              <label v-if="r.type !== 'догляд'" class="flex items-center gap-1.5 text-sm text-agro-dark">
                <input v-model="r.to_techcard" type="checkbox" class="accent-agro" :disabled="!!r.treatment_id" data-test="ins-rec-techcard">
                {{ r.treatment_id ? 'Уже в техкарті' : 'Додати в техкарту' }}
              </label>
              <button type="button" class="ins-link text-red-600 ml-auto" @click="form.recs.splice(i, 1)">Прибрати</button>
            </div>
            <input v-model="r.note" class="input mt-2" maxlength="500" placeholder="Умови, строк очікування, на що звернути увагу">
          </div>
        </div>
      </section>

      <section class="card">
        <label class="block"><span class="ins-h block mb-2">Висновок</span>
          <textarea v-model="form.summary" class="input" rows="4" maxlength="3000" placeholder="Загальна оцінка насадження і що робити найближчим часом" data-test="ins-summary" /></label>
      </section>

      <div class="flex flex-wrap gap-2 justify-end pb-8">
        <button type="submit" class="btn-outline" :disabled="saving">Зберегти чернетку</button>
        <button type="button" class="btn-primary" :disabled="saving" data-test="ins-send" @click="save(true)">
          {{ saving ? 'Зберігаю…' : form.sent_at ? 'Зберегти й надіслати ще раз' : 'Зберегти й надіслати фермеру' }}
        </button>
      </div>

      <datalist v-for="(names, kind) in catalog" :id="`cat-${kind}`" :key="kind">
        <option v-for="n in names" :key="n" :value="n" />
      </datalist>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Акт огляду — АгроПростір' })

const CONDITIONS: Record<string, string> = { good: 'Добрий', attention: 'Потребує уваги', bad: 'Потрібні термінові дії' }
const KINDS: Record<string, string> = { disease: 'Хвороба', pest: 'Шкідник', weed: "Бур'ян", nutrition: 'Живлення', other: 'Інше' }
const SEVERITY: Record<string, string> = { low: 'слабко', medium: 'помірно', high: 'сильно' }
const REC_TYPES = ['захист', 'підживлення', 'полив', 'догляд']
const BUCKET = 'inspection-photos'

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient() as any
const toast = useToast()
const authHeader = useAuthHeader()
const growthPhases = useGrowthPhases()
const today = new Date().toLocaleDateString('sv-SE')

interface Photo { key: string; path?: string; file?: File; url: string }
interface Finding { key: string; kind: string; name: string; severity: string; affected_pct: string; note: string; photos: Photo[] }
interface Rec { key: string; type: string; product_name: string; dosage: string; due_date: string; note: string; to_techcard: boolean; treatment_id: string | null }

const loading = ref(true)
const saving = ref(false)
const crop = ref<any>(null)
const clientName = ref('')
const currentPhase = ref<string | null>(null)
const catalog = reactive<Record<string, string[]>>({ disease: [], pest: [], weed: [] })
const form = reactive({
  id: '' as string, visited_at: today, phase_key: '', condition: 'good', summary: '', sent_at: null as string | null,
  findings: [] as Finding[], recs: [] as Rec[],
})
let removedPhotos: string[] = []
let originalPhotos: string[] = []

const phaseOptions = computed(() => crop.value ? growthPhases.phasesForCrop(crop.value.crop_type).map(p => p.key) : [])
const key = () => Math.random().toString(36).slice(2)

const addFinding = () => form.findings.push({ key: key(), kind: 'disease', name: '', severity: 'low', affected_pct: '', note: '', photos: [] })
const addRec = () => form.recs.push({ key: key(), type: 'захист', product_name: '', dosage: '', due_date: '', note: '', to_techcard: true, treatment_id: null })

const addPhotos = (f: Finding, e: Event) => {
  const input = e.target as HTMLInputElement
  for (const file of Array.from(input.files || []).slice(0, 6 - f.photos.length)) {
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { toast.error('Фото до 10 МБ, лише зображення'); continue }
    f.photos.push({ key: key(), file, url: URL.createObjectURL(file) })
  }
  input.value = ''
}

const load = async () => {
  await growthPhases.load()
  let cropId = typeof route.query.cropId === 'string' ? route.query.cropId : ''
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  if (id) {
    const { data: insp } = await supabase.from('planting_inspections').select('*').eq('id', id).maybeSingle()
    if (!insp) { loading.value = false; return }
    cropId = insp.farm_crop_id
    const [{ data: fs }, { data: rs }] = await Promise.all([
      supabase.from('inspection_findings').select('*').eq('inspection_id', id).order('sort_order'),
      supabase.from('inspection_recommendations').select('*').eq('inspection_id', id).order('sort_order'),
    ])
    const paths = (fs || []).flatMap((f: any) => f.photos || [])
    const { data: signed } = paths.length ? await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600) : { data: [] }
    const urlOf = (p: string) => (signed || []).find((s: any) => s.path === p)?.signedUrl || ''
    originalPhotos = paths
    Object.assign(form, {
      id, visited_at: insp.visited_at, phase_key: insp.phase_key || '', condition: insp.condition, summary: insp.summary || '', sent_at: insp.sent_at,
      findings: (fs || []).map((f: any) => ({ key: key(), kind: f.kind, name: f.name, severity: f.severity, affected_pct: f.affected_pct != null ? String(f.affected_pct) : '', note: f.note || '',
        photos: (f.photos || []).map((p: string) => ({ key: key(), path: p, url: urlOf(p) })) })),
      recs: (rs || []).map((r: any) => ({ key: key(), type: r.type, product_name: r.product_name, dosage: r.dosage || '', due_date: r.due_date || '', note: r.note || '', to_techcard: !!r.treatment_id, treatment_id: r.treatment_id })),
    })
  }
  if (!cropId) { loading.value = false; return }

  const { data: c } = await supabase.from('farm_crops').select('id, crop_type, variety, farm_id, farms(name, user_id)').eq('id', cropId).maybeSingle()
  if (!c) { loading.value = false; return }
  crop.value = { ...c, farm_name: c.farms?.name }
  const [{ data: prof }, { data: ph }] = await Promise.all([
    supabase.from('public_profiles').select('name').eq('id', c.farms?.user_id).maybeSingle(),
    supabase.from('planting_phases').select('phase_key').eq('farm_crop_id', cropId).order('observed_at', { ascending: false }).order('created_at', { ascending: false }).limit(1),
  ])
  clientName.value = prof?.name || 'клієнт'
  currentPhase.value = ph?.[0]?.phase_key ?? null
  if (!form.id) form.phase_key = currentPhase.value ?? ''

  // Підказки назв з довідника: хвороби й шкідники цієї культури, бур'яни — усі
  const stem = c.crop_type.toLowerCase().split(/\s+/)[0].slice(0, 5)
  const strip = (n: string) => n.replace(/\s*\([^)]*[ыэъё][^)]*\)\s*$/i, '').trim()
  const [d, p, w] = await Promise.all([
    supabase.from('agro_diseases').select('name').ilike('culture', `%${stem}%`).limit(150),
    supabase.from('agro_pests').select('name').ilike('culture', `%${stem}%`).limit(150),
    supabase.from('agro_weeds').select('name').limit(200),
  ])
  catalog.disease = [...new Set((d.data || []).map((r: any) => strip(r.name)))] as string[]
  catalog.pest = [...new Set((p.data || []).map((r: any) => strip(r.name)))] as string[]
  catalog.weed = [...new Set((w.data || []).map((r: any) => strip(r.name)))] as string[]
  loading.value = false
}

const extOf = (f: File) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' } as Record<string, string>)[f.type] || 'jpg'

const save = async (send: boolean) => {
  if (!crop.value || saving.value) return
  if (form.findings.some(f => !f.name.trim()) || form.recs.some(r => !r.product_name.trim())) { toast.error('Заповніть назви знахідок і рекомендацій'); return }
  saving.value = true
  try {
    const row = { farm_crop_id: crop.value.id, visited_at: form.visited_at, phase_key: form.phase_key || null, condition: form.condition, summary: form.summary.trim() || null }
    const res = form.id
      ? await supabase.from('planting_inspections').update(row).eq('id', form.id).select('id').single()
      : await supabase.from('planting_inspections').insert(row).select('id').single()
    if (res.error) throw res.error
    form.id = res.data.id

    // Фото: нові — у сховище, прибрані — геть
    for (const f of form.findings) {
      for (const ph of f.photos) {
        if (ph.path || !ph.file) continue
        const path = `${crop.value.id}/${form.id}/${crypto.randomUUID()}.${extOf(ph.file)}`
        const { error } = await supabase.storage.from(BUCKET).upload(path, ph.file, { contentType: ph.file.type })
        if (error) throw error
        ph.path = path
      }
    }
    const kept = new Set(form.findings.flatMap(f => f.photos.map(p => p.path)))
    removedPhotos = originalPhotos.filter(p => !kept.has(p))
    if (removedPhotos.length) await supabase.storage.from(BUCKET).remove(removedPhotos)
    originalPhotos = [...kept].filter(Boolean) as string[]

    // Обробки в техкарту клієнта (лише ще не додані)
    const toCard = form.recs.filter(r => r.to_techcard && !r.treatment_id && r.type !== 'догляд')
    if (toCard.length) {
      let { data: program } = await supabase.from('protection_programs').select('id').eq('farm_crop_id', crop.value.id).limit(1).maybeSingle()
      if (!program) {
        program = (await supabase.from('protection_programs').insert({ farm_crop_id: crop.value.id, name: `Програма — ${crop.value.crop_type}` }).select('id').single()).data
      }
      if (!program) throw new Error('Не вдалося відкрити техкарту клієнта')
      const date = `${form.visited_at.slice(8, 10)}.${form.visited_at.slice(5, 7)}`
      for (const r of toCard) {
        const { data: t, error } = await supabase.from('program_treatments').insert({
          program_id: program.id, phase: form.phase_key || currentPhase.value || null, type: r.type, product_name: r.product_name.trim(),
          dosage: r.dosage.trim() || null, status: 'planned', notes: [`З акта огляду ${date}`, r.note.trim()].filter(Boolean).join('. '),
        }).select('id').single()
        if (error) throw error
        r.treatment_id = t.id
      }
    }

    // Знахідки й рекомендації — переписуємо цілком
    await Promise.all([
      supabase.from('inspection_findings').delete().eq('inspection_id', form.id),
      supabase.from('inspection_recommendations').delete().eq('inspection_id', form.id),
    ])
    const pct = (s: string) => { const n = parseInt(s, 10); return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null }
    const [fi, ri] = await Promise.all([
      form.findings.length ? supabase.from('inspection_findings').insert(form.findings.map((f, i) => ({
        inspection_id: form.id, kind: f.kind, name: f.name.trim(), severity: f.severity, affected_pct: pct(f.affected_pct),
        note: f.note.trim() || null, photos: f.photos.map(p => p.path).filter(Boolean), sort_order: i,
      }))) : { error: null },
      form.recs.length ? supabase.from('inspection_recommendations').insert(form.recs.map((r, i) => ({
        inspection_id: form.id, type: r.type, product_name: r.product_name.trim(), dosage: r.dosage.trim() || null,
        due_date: r.due_date || null, note: r.note.trim() || null, treatment_id: r.treatment_id, sort_order: i,
      }))) : { error: null },
    ])
    if (fi.error || ri.error) throw fi.error || ri.error

    // Фаза з огляду — у журнал фенофаз клієнта, якщо відрізняється від останньої
    if (form.phase_key && form.phase_key !== currentPhase.value) {
      const { error } = await supabase.from('planting_phases').insert({ farm_crop_id: crop.value.id, phase_key: form.phase_key, observed_at: form.visited_at, note: 'Огляд агронома' })
      if (!error) currentPhase.value = form.phase_key
    }

    if (send) {
      await $fetch('/api/inspections/send', { method: 'POST', headers: await authHeader(), body: { id: form.id } })
      toast.success('Акт надіслано фермеру')
    } else toast.success('Акт збережено')
    await router.push(`/dashboard/inspection/${form.id}`)
  } catch (e: any) {
    console.error('[inspection save]', e)
    toast.error(e?.data?.message || 'Не вдалося зберегти акт')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.ins-label { display: block; font-size: 12px; font-weight: 700; color: rgb(91, 107, 83); margin-bottom: 4px; }
.ins-h { font-family: 'Bitter', Georgia, serif; font-size: 16px; font-weight: 800; color: rgb(27, 46, 27); }
.ins-item { border: 1px solid rgb(226, 232, 214); border-radius: 12px; padding: 12px; background: rgb(250, 251, 247); }
.ins-seg { padding: 6px 14px; border-radius: 9px; font-size: 13px; font-weight: 600; color: rgb(70, 90, 64); background: white; border: 1px solid rgb(214, 224, 196); }
.ins-seg-sm { padding: 3px 10px; font-size: 12px; }
.ins-seg[aria-pressed="true"] { background: rgb(47, 82, 51); border-color: rgb(47, 82, 51); color: white; }
.ins-seg[data-cond="attention"][aria-pressed="true"] { background: rgb(180, 110, 20); border-color: rgb(180, 110, 20); }
.ins-seg[data-cond="bad"][aria-pressed="true"] { background: rgb(170, 40, 40); border-color: rgb(170, 40, 40); }
.ins-btn { padding: 5px 12px; border-radius: 9px; font-size: 13px; font-weight: 600; color: rgb(47, 82, 51); background: white; border: 1px solid rgb(214, 224, 196); }
.ins-btn:hover { background: rgb(238, 241, 227); }
.ins-link { font-size: 12px; font-weight: 600; }
.ins-pct { width: 72px; padding: 4px 8px; }
.ins-date { width: 150px; padding: 4px 8px; }
.ins-photo { position: relative; width: 84px; height: 84px; border-radius: 10px; overflow: hidden; border: 1px solid rgb(214, 224, 196); background: white; }
.ins-photo img { width: 100%; height: 100%; object-fit: cover; }
.ins-photo-x { position: absolute; top: 3px; right: 3px; width: 22px; height: 22px; border-radius: 99px; background: rgba(0, 0, 0, .55); color: white; font-size: 11px; }
.ins-photo-add { display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: rgb(47, 82, 51); cursor: pointer; border-style: dashed; }
</style>

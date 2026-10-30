<template>
  <div class="dash-page">
    <div class="dash-head">
      <button type="button" class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors" aria-label="Назад" @click="router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Акт огляду{{ insp ? ` від ${dmy(insp.visited_at)}` : '' }}</h1>
        <p class="dash-subtitle truncate">{{ crop ? `${crop.crop_type}${crop.variety ? ` · ${crop.variety}` : ''} · ${crop.farms?.name}` : '' }}</p>
      </div>
      <div v-if="insp" class="flex flex-wrap gap-2 shrink-0">
        <button type="button" class="btn-outline text-sm" data-test="ins-print" @click="print">Друк / PDF</button>
        <NuxtLink v-if="isAuthor" :to="`/dashboard/inspection/edit?id=${insp.id}`" class="btn-outline text-sm">Редагувати</NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="space-y-3"><div v-for="i in 3" :key="i" class="card animate-pulse h-24" /></div>
    <div v-else-if="!insp" class="card text-center py-12">
      <p class="font-bold text-agro-dark mb-2">Акт не знайдено</p>
      <p class="text-sm text-agro-light">Можливо, його видалено або у вас немає доступу до цього поля.</p>
    </div>

    <div v-else class="space-y-5 max-w-3xl" data-test="inspection-view">
      <section class="card">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="ins-cond" :data-cond="insp.condition" data-test="ins-condition">{{ CONDITIONS[insp.condition] }}</span>
          <span v-if="insp.phase_key" class="text-sm text-agro-light">фаза «{{ insp.phase_key }}»</span>
          <span class="text-sm text-agro-light ml-auto">{{ authorName }}<template v-if="insp.sent_at"> · надіслано {{ dmy(insp.sent_at.slice(0, 10)) }}</template></span>
        </div>
        <p v-if="insp.summary" class="text-agro-dark whitespace-pre-line leading-relaxed" data-test="ins-summary">{{ insp.summary }}</p>
        <p v-else class="text-sm text-agro-light">Без висновку.</p>
        <div v-if="isAuthor && !insp.sent_at" class="mt-4 flex flex-wrap items-center gap-3 p-3 rounded-xl bg-amber-50 text-sm text-amber-900">
          Акт ще не надіслано фермеру.
          <button type="button" class="btn-primary text-sm" :disabled="sending" data-test="ins-send-now" @click="send">Надіслати</button>
        </div>
      </section>

      <section class="card">
        <h2 class="ins-h mb-3">Що знайдено</h2>
        <p v-if="!findings.length" class="text-sm text-agro-light">Проблем не виявлено.</p>
        <div class="space-y-3">
          <div v-for="f in findings" :key="f.id" class="ins-item" data-test="ins-finding-view">
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="text-xs font-semibold uppercase tracking-wide text-agro-light">{{ KINDS[f.kind] }}</span>
              <span class="font-semibold text-agro-dark">{{ f.name }}</span>
              <span class="ins-sev" :data-sev="f.severity">{{ SEVERITY[f.severity] }}</span>
              <span v-if="f.affected_pct != null" class="text-sm text-agro-light">уражено {{ f.affected_pct }}%</span>
            </div>
            <p v-if="f.note" class="text-sm text-agro-dark mt-1 whitespace-pre-line">{{ f.note }}</p>
            <div v-if="f.photos?.length" class="flex flex-wrap gap-2 mt-2">
              <a v-for="p in f.photos" :key="p" :href="photoUrl(p)" target="_blank" rel="noopener" class="ins-photo">
                <img :src="photoUrl(p)" :alt="`Фото: ${f.name}`" loading="lazy">
              </a>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="ins-h mb-3">Рекомендації</h2>
        <p v-if="!recs.length" class="text-sm text-agro-light">Без рекомендацій.</p>
        <div class="space-y-2">
          <div v-for="r in recs" :key="r.id" class="ins-item" data-test="ins-rec-view">
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="text-xs font-semibold uppercase tracking-wide text-agro-light">{{ r.type }}</span>
              <span class="font-semibold text-agro-dark">{{ r.product_name }}</span>
              <span v-if="r.dosage" class="text-sm text-agro-dark">· {{ r.dosage }}</span>
              <span v-if="r.due_date" class="text-sm text-agro-light">· до {{ dmy(r.due_date) }}</span>
            </div>
            <p v-if="r.note" class="text-sm text-agro-light mt-1">{{ r.note }}</p>
            <NuxtLink v-if="r.treatment_id && crop" :to="techcardLink" class="text-xs text-agro font-semibold hover:underline">У техкарті →</NuxtLink>
          </div>
        </div>
      </section>

      <section v-if="others.length" class="card">
        <h2 class="ins-h mb-2">Інші огляди цього насадження</h2>
        <div class="flex flex-wrap gap-2">
          <NuxtLink v-for="o in others" :key="o.id" :to="`/dashboard/inspection/${o.id}`" class="ins-other">
            {{ dmy(o.visited_at) }} · {{ CONDITIONS[o.condition] }}
          </NuxtLink>
        </div>
      </section>

      <div v-if="isAuthor" class="flex justify-end pb-8">
        <button v-if="!confirmDelete" type="button" class="text-sm text-red-600 font-semibold hover:underline" @click="confirmDelete = true">Видалити акт</button>
        <div v-else class="flex items-center gap-2 text-sm">
          Видалити акт разом із фото?
          <button type="button" class="btn-outline text-sm" @click="confirmDelete = false">Ні</button>
          <button type="button" class="btn-primary text-sm bg-red-700" @click="remove">Видалити</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { escapeHtml } from '~~/shared/utils/html'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Акт огляду — АгроПростір' })

const CONDITIONS: Record<string, string> = { good: 'Добрий стан', attention: 'Потребує уваги', bad: 'Потрібні термінові дії' }
const KINDS: Record<string, string> = { disease: 'Хвороба', pest: 'Шкідник', weed: "Бур'ян", nutrition: 'Живлення', other: 'Інше' }
const SEVERITY: Record<string, string> = { low: 'слабко', medium: 'помірно', high: 'сильно' }
const BUCKET = 'inspection-photos'

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient() as any
const toast = useToast()
const authHeader = useAuthHeader()

const loading = ref(true)
const sending = ref(false)
const confirmDelete = ref(false)
const insp = ref<any>(null)
const crop = ref<any>(null)
const findings = ref<any[]>([])
const recs = ref<any[]>([])
const others = ref<any[]>([])
const signed = ref<Record<string, string>>({})
const authorName = ref('')
const isAuthor = ref(false)

const dmy = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`
const photoUrl = (p: string) => signed.value[p] || ''
const techcardLink = computed(() => crop.value ? `/dashboard/protection?farmCropId=${crop.value.id}&cropType=${encodeURIComponent(crop.value.crop_type)}` : '')

const load = async () => {
  loading.value = true
  const id = route.params.id as string
  const { data: { session } } = await supabase.auth.getSession()
  const { data } = await supabase.from('planting_inspections').select('*').eq('id', id).maybeSingle()
  insp.value = data
  if (!data) { loading.value = false; return }
  isAuthor.value = data.created_by === session?.user?.id
  const [c, fs, rs, o, a] = await Promise.all([
    supabase.from('farm_crops').select('id, crop_type, variety, area_ha, farm_id, farms(name, region, cadastral_number)').eq('id', data.farm_crop_id).maybeSingle(),
    supabase.from('inspection_findings').select('*').eq('inspection_id', id).order('sort_order'),
    supabase.from('inspection_recommendations').select('*').eq('inspection_id', id).order('sort_order'),
    supabase.from('planting_inspections').select('id, visited_at, condition').eq('farm_crop_id', data.farm_crop_id).neq('id', id).order('visited_at', { ascending: false }).limit(10),
    supabase.from('public_profiles').select('name').eq('id', data.created_by).maybeSingle(),
  ])
  crop.value = c.data
  findings.value = fs.data || []
  recs.value = rs.data || []
  others.value = o.data || []
  authorName.value = a.data?.name ? `Агроном ${a.data.name}` : 'Агроном'
  const paths = findings.value.flatMap(f => f.photos || [])
  if (paths.length) {
    const { data: s } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
    signed.value = Object.fromEntries((s || []).filter((x: any) => x.signedUrl).map((x: any) => [x.path, x.signedUrl]))
  }
  loading.value = false
}

const send = async () => {
  sending.value = true
  try {
    const res = await $fetch<{ sentAt: string }>('/api/inspections/send', { method: 'POST', headers: await authHeader(), body: { id: insp.value.id } })
    insp.value.sent_at = res.sentAt
    toast.success('Акт надіслано фермеру')
  } catch (e: any) {
    toast.error(e?.data?.message || 'Не вдалося надіслати')
  } finally {
    sending.value = false
  }
}

const remove = async () => {
  const paths = findings.value.flatMap(f => f.photos || [])
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
  const { error } = await supabase.from('planting_inspections').delete().eq('id', insp.value.id)
  if (error) { toast.error('Не вдалося видалити'); return }
  toast.success('Акт видалено')
  router.back()
}

// Друк: окреме вікно з акта (як журнал обробок)
const print = () => {
  const w = window.open('', '_blank')
  if (!w) { toast.error('Дозвольте спливні вікна для друку'); return }
  const i = insp.value, c = crop.value
  const e = (s: any) => escapeHtml(String(s ?? ''))
  const fRows = findings.value.map(f => `<tr><td>${e(KINDS[f.kind])}</td><td><b>${e(f.name)}</b>${f.note ? `<div class="n">${e(f.note)}</div>` : ''}${(f.photos || []).map((p: string) => photoUrl(p) ? `<img src="${e(photoUrl(p))}">` : '').join('')}</td><td>${e(SEVERITY[f.severity])}</td><td>${f.affected_pct != null ? `${f.affected_pct}%` : '—'}</td></tr>`).join('')
  const rRows = recs.value.map(r => `<tr><td>${e(r.type)}</td><td><b>${e(r.product_name)}</b>${r.note ? `<div class="n">${e(r.note)}</div>` : ''}</td><td>${e(r.dosage || '—')}</td><td>${r.due_date ? dmy(r.due_date) : '—'}</td></tr>`).join('')
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Акт огляду ${dmy(i.visited_at)} — ${e(c?.crop_type)}</title><style>
    body{font:13px/1.45 system-ui,sans-serif;color:#1b2e1b;margin:24px} h1{font-size:20px;margin:0 0 4px} h2{font-size:15px;margin:22px 0 8px}
    .m{color:#5b6b53} table{width:100%;border-collapse:collapse} td,th{border:1px solid #cfd8c4;padding:6px 8px;vertical-align:top;text-align:left}
    th{background:#eef1e3;font-size:12px} .n{color:#5b6b53;font-size:12px;margin-top:2px} img{height:90px;margin:4px 4px 0 0;border-radius:4px}
    .sig{margin-top:40px;display:flex;gap:40px} .sig div{flex:1;border-top:1px solid #1b2e1b;padding-top:4px;font-size:12px}
    @page{size:A4;margin:14mm}</style></head><body>${printBrand()}
    <h1>Акт огляду насадження</h1>
    <p class="m">${dmy(i.visited_at)} · ${e(c?.crop_type)}${c?.variety ? `, сорт ${e(c.variety)}` : ''} · ${e(c?.farms?.name)}${c?.area_ha ? ` · ${e(c.area_ha)} га` : ''}${c?.farms?.cadastral_number ? ` · кадастр ${e(c.farms.cadastral_number)}` : ''}</p>
    <p><b>Стан:</b> ${e(CONDITIONS[i.condition])}${i.phase_key ? ` · <b>Фаза:</b> ${e(i.phase_key)}` : ''}</p>
    ${i.summary ? `<h2>Висновок</h2><p>${e(i.summary).replace(/\n/g, '<br>')}</p>` : ''}
    <h2>Що знайдено</h2>${fRows ? `<table><tr><th>Тип</th><th>Назва</th><th>Ступінь</th><th>Уражено</th></tr>${fRows}</table>` : '<p class="m">Проблем не виявлено.</p>'}
    <h2>Рекомендації</h2>${rRows ? `<table><tr><th>Тип</th><th>Препарат / робота</th><th>Норма</th><th>До</th></tr>${rRows}</table>` : '<p class="m">Без рекомендацій.</p>'}
    <div class="sig"><div>${e(authorName.value)} (підпис)</div><div>Ознайомлений: власник насадження (підпис)</div></div>
    <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`)
  w.document.close()
}

onMounted(load)
</script>

<style scoped>
.ins-h { font-family: 'Bitter', Georgia, serif; font-size: 16px; font-weight: 800; color: rgb(27, 46, 27); }
.ins-item { border: 1px solid rgb(226, 232, 214); border-radius: 12px; padding: 10px 12px; background: rgb(250, 251, 247); }
.ins-cond { padding: 3px 12px; border-radius: 99px; font-size: 13px; font-weight: 700; background: rgb(227, 241, 225); color: rgb(30, 100, 40); }
.ins-cond[data-cond="attention"] { background: rgb(253, 240, 214); color: rgb(150, 90, 10); }
.ins-cond[data-cond="bad"] { background: rgb(253, 226, 226); color: rgb(160, 30, 30); }
.ins-sev { font-size: 12px; font-weight: 600; padding: 1px 8px; border-radius: 99px; background: rgb(238, 241, 227); color: rgb(70, 90, 64); }
.ins-sev[data-sev="medium"] { background: rgb(253, 240, 214); color: rgb(150, 90, 10); }
.ins-sev[data-sev="high"] { background: rgb(253, 226, 226); color: rgb(160, 30, 30); }
.ins-photo { width: 110px; height: 110px; border-radius: 10px; overflow: hidden; border: 1px solid rgb(214, 224, 196); display: block; }
.ins-photo img { width: 100%; height: 100%; object-fit: cover; }
.ins-other { font-size: 13px; padding: 4px 12px; border-radius: 99px; border: 1px solid rgb(214, 224, 196); color: rgb(47, 82, 51); }
.ins-other:hover { background: rgb(238, 241, 227); }
</style>

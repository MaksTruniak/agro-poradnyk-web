<template>
  <div class="dash-page">
    <div class="dash-head">
      <button type="button" class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors" aria-label="Назад" @click="router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Паспорт партії</h1>
        <p v-if="p" class="dash-subtitle truncate">{{ p.deal.crop_type }} · {{ fmtNum(p.deal.quantity_tons) }} т · {{ otherName }}</p>
      </div>
      <button v-if="p?.crop" type="button" class="btn-outline text-sm shrink-0" data-test="passport-print" @click="print">Друк / PDF</button>
    </div>

    <div v-if="loading" class="space-y-3"><div v-for="i in 3" :key="i" class="card animate-pulse h-24" /></div>

    <div v-else-if="!p" class="card text-center py-12">
      <p class="font-bold text-agro-dark mb-2">Угоду не знайдено</p>
      <p class="text-sm text-agro-light">Паспорт бачать лише сторони угоди.</p>
    </div>

    <div v-else class="space-y-5 max-w-3xl" data-test="passport-view">
      <!-- Фермер: доступ заготівельника -->
      <section v-if="isFarmerSide" class="card flex flex-wrap items-center gap-4" data-test="passport-share">
        <div class="flex-1 min-w-[220px]">
          <p class="font-semibold text-agro-dark text-sm">{{ p.shared ? 'Заготівельник бачить паспорт' : 'Паспорт бачите лише ви' }}</p>
          <p class="text-xs text-agro-light mt-0.5">
            Заготівельнику відкриються сорт, фенофази, виконані обробки зі строками очікування й акти агронома цієї культури за сезон — без приміток, фото й адреси поля.
          </p>
        </div>
        <button v-if="p.can_share" type="button" class="shrink-0 text-sm" :class="p.shared ? 'btn-outline' : 'btn-primary'"
          :disabled="sharing || !p.crop" data-test="passport-share-toggle" @click="toggleShare">
          {{ p.shared ? 'Закрити доступ' : 'Відкрити заготівельнику' }}
        </button>
      </section>

      <div v-if="!p.crop" class="card text-center py-10 text-agro-light" data-test="passport-empty">
        <template v-if="!isFarmerSide && !p.shared">
          <p class="text-3xl mb-2">🔒</p>
          <p class="font-semibold text-agro-dark mb-1">Фермер ще не відкрив паспорт партії</p>
          <p class="text-sm">Попросіть у чаті угоди — фермер відкриє його одним натиском.</p>
        </template>
        <template v-else>
          <p class="font-semibold text-agro-dark mb-1">Угода не прив'язана до насадження</p>
          <p class="text-sm">Паспорт складається з журналу культури, з якої продано урожай.</p>
        </template>
      </div>

      <template v-else>
        <section class="pp-banner" :data-status="check.status" data-test="passport-waiting">
          <template v-if="check.status === 'violated'">
            <p class="font-semibold">Строк очікування на {{ dmy(onDate) }} ще не минув</p>
            <p class="text-sm">Після обробки «{{ check.latest!.product }}» збирати й відвантажувати можна з {{ dmy(check.latest!.from) }}.</p>
          </template>
          <template v-else-if="check.status === 'ok'">
            <p class="font-semibold">Строки очікування дотримано на {{ dmy(onDate) }}</p>
            <p v-if="check.latest" class="text-sm">Останній строк — після «{{ check.latest.product }}», минув {{ dmy(check.latest.from) }}.</p>
          </template>
          <p v-else class="font-semibold">Обробок препаратами за сезон {{ p.season }} не записано</p>
          <p v-if="check.unknown" class="text-sm mt-1">Для {{ check.unknown }} {{ plural(check.unknown, 'обробки', 'обробок', 'обробок') }} строк очікування не вказано — перевірте за етикеткою препарату.</p>
        </section>

        <section class="card">
          <h2 class="pp-h mb-3">Насадження</h2>
          <dl class="pp-dl">
            <dt>Культура</dt><dd>{{ p.crop.crop_type }}<template v-if="p.crop.variety">, сорт {{ p.crop.variety }}</template></dd>
            <template v-if="p.crop.planting_year"><dt>Рік садіння</dt><dd>{{ p.crop.planting_year }}</dd></template>
            <template v-if="p.crop.area_ha"><dt>Площа</dt><dd>{{ fmtNum(p.crop.area_ha) }} га</dd></template>
            <dt>Поле</dt><dd>{{ [p.crop.farm_name, p.crop.city, p.crop.region].filter(Boolean).join(', ') }}</dd>
            <dt>Сезон</dt><dd>{{ p.season }}, записи до {{ dmy(p.period_to) }}</dd>
          </dl>
        </section>

        <section class="card">
          <h2 class="pp-h mb-3">Обробки</h2>
          <p v-if="!p.treatments.length" class="text-sm text-agro-light">За сезон обробок не записано.</p>
          <div v-else class="overflow-x-auto">
            <table class="pp-table" data-test="passport-treatments">
              <thead><tr><th>Дата</th><th>Препарат</th><th>Доза</th><th>Строк очікування</th></tr></thead>
              <tbody>
                <tr v-for="(t, i) in p.treatments" :key="i" data-test="passport-treatment">
                  <td class="whitespace-nowrap">{{ dmy(t.date) }}</td>
                  <td><b>{{ t.product_name }}</b><span class="pp-sub">{{ t.type }}<template v-if="t.phase"> · {{ t.phase }}</template></span></td>
                  <td>{{ t.dosage || '—' }}</td>
                  <td class="whitespace-nowrap">
                    <template v-if="t.waiting_days">{{ t.waiting_days }} дн. · з {{ dmy(passportHarvestFrom(t)!) }}</template>
                    <template v-else-if="t.waiting_days === 0">без обмежень</template>
                    <template v-else-if="needsWaiting(t)"><span class="text-amber-700">не вказано</span></template>
                    <template v-else>—</template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="p.phases.length" class="card">
          <h2 class="pp-h mb-3">Фенофази</h2>
          <ul class="space-y-1 text-sm">
            <li v-for="(ph, i) in p.phases" :key="i"><span class="text-agro-light">{{ dmy(ph.observed_at) }}</span> · {{ ph.phase_key }}</li>
          </ul>
        </section>

        <section v-if="p.inspections.length" class="card">
          <h2 class="pp-h mb-3">Огляди агронома</h2>
          <div class="space-y-3">
            <div v-for="(ins, i) in p.inspections" :key="i" class="text-sm" data-test="passport-inspection">
              <p><b>{{ dmy(ins.visited_at) }}</b> · {{ CONDITIONS[ins.condition] }}<template v-if="ins.agronomist"> · {{ ins.agronomist }}</template></p>
              <p v-if="ins.findings.length" class="text-agro-light">{{ ins.findings.map(f => `${f.name} (${SEVERITY[f.severity]})`).join(', ') }}</p>
              <p v-else class="text-agro-light">Проблем не виявлено</p>
            </div>
          </div>
        </section>

        <p class="text-xs text-agro-light">
          Паспорт складено з журналу фермера в АгроПросторі: техкарта, журнал обробок, фенофази й надіслані акти огляду агронома.
          Строк очікування — за даними, які вніс фермер.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { escapeHtml } from '~~/shared/utils/html'
import { needsWaiting, passportHarvestFrom, waitingCheck, type PassportTreatment } from '~~/shared/utils/dealPassport'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Паспорт партії — АгроПростір' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient() as any

const CONDITIONS: Record<string, string> = { good: 'добрий стан', attention: 'потребує уваги', bad: 'потрібні термінові дії' }
const SEVERITY: Record<string, string> = { low: 'слабко', medium: 'помірно', high: 'сильно' }

const loading = ref(true)
const sharing = ref(false)
const p = ref<any>(null)
const uid = ref('')
const otherName = ref('')

const isFarmerSide = computed(() => !!p.value && uid.value !== p.value.deal.buyer_id)
const today = new Date().toLocaleDateString('sv-SE')
// Дата відвантаження: завершення угоди, інакше сьогодні
const onDate = computed(() => p.value?.deal.completed_at?.slice(0, 10) || today)
const check = computed(() => waitingCheck((p.value?.treatments || []) as PassportTreatment[], onDate.value))

const dmy = (iso: string) => iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : ''
const fmtNum = (n: number | string) => String(n).replace('.', ',')
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
}

const load = async () => {
  const { data } = await supabase.rpc('deal_passport', { p_deal_id: route.params.id })
  p.value = data || null
}

const toggleShare = async () => {
  sharing.value = true
  const { error } = await supabase.rpc('share_deal_passport', { p_deal_id: p.value.deal.id, p_shared: !p.value.shared })
  sharing.value = false
  if (error) { toast.error('Не вдалося змінити доступ'); return }
  toast.success(p.value.shared ? 'Паспорт закрито' : 'Паспорт відкрито заготівельнику')
  await load()
}

const print = () => {
  const w = window.open('', '_blank')
  if (!w) { toast.error('Дозвольте спливні вікна для друку'); return }
  const v = p.value, c = v.crop, ch = check.value
  const e = (s: any) => escapeHtml(String(s ?? ''))
  const tRows = v.treatments.map((t: PassportTreatment) => `<tr><td>${dmy(t.date)}</td><td><b>${e(t.product_name)}</b><div class="n">${e(t.type)}${t.phase ? ` · ${e(t.phase)}` : ''}</div></td><td>${e(t.dosage || '—')}</td><td>${t.waiting_days ? `${t.waiting_days} дн. · з ${dmy(passportHarvestFrom(t)!)}` : t.waiting_days === 0 ? 'без обмежень' : needsWaiting(t) ? 'не вказано' : '—'}</td></tr>`).join('')
  const status = ch.status === 'violated' ? `Строк очікування на ${dmy(onDate.value)} ще не минув: після «${e(ch.latest!.product)}» — з ${dmy(ch.latest!.from)}`
    : ch.status === 'ok' ? `Строки очікування дотримано на ${dmy(onDate.value)}${ch.latest ? ` (останній — ${dmy(ch.latest.from)}, «${e(ch.latest.product)}»)` : ''}`
      : `Обробок препаратами за сезон ${v.season} не записано`
  const insp = v.inspections.map((i: any) => `<li>${dmy(i.visited_at)} · ${e(CONDITIONS[i.condition])}${i.agronomist ? ` · ${e(i.agronomist)}` : ''}${i.findings.length ? ` — ${i.findings.map((f: any) => `${e(f.name)} (${e(SEVERITY[f.severity])})`).join(', ')}` : ''}</li>`).join('')
  const phases = v.phases.map((ph: any) => `${dmy(ph.observed_at)} — ${e(ph.phase_key)}`).join('; ')
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Паспорт партії — ${e(c.crop_type)}</title><style>
    body{font:13px/1.45 system-ui,sans-serif;color:#1b2e1b;margin:24px} h1{font-size:20px;margin:0 0 4px} h2{font-size:15px;margin:22px 0 8px}
    .m{color:#5b6b53} table{width:100%;border-collapse:collapse} td,th{border:1px solid #cfd8c4;padding:6px 8px;vertical-align:top;text-align:left}
    th{background:#eef1e3;font-size:12px} .n{color:#5b6b53;font-size:12px;margin-top:2px} .s{padding:8px 10px;border:1px solid #cfd8c4;border-radius:6px}
    @page{size:A4;margin:14mm}</style></head><body>
    <h1>Паспорт партії</h1>
    <p class="m">${e(v.deal.crop_type)} · ${fmtNum(v.deal.quantity_tons)} т · угода від ${dmy((v.deal.confirmed_at || v.deal.created_at).slice(0, 10))}</p>
    <p><b>Насадження:</b> ${e(c.crop_type)}${c.variety ? `, сорт ${e(c.variety)}` : ''}${c.planting_year ? `, садіння ${e(c.planting_year)}` : ''}${c.area_ha ? `, ${fmtNum(c.area_ha)} га` : ''} · ${e([c.farm_name, c.city, c.region].filter(Boolean).join(', '))}</p>
    <p class="s">${status}${ch.unknown ? `<br>Для ${ch.unknown} обробок строк очікування не вказано.` : ''}</p>
    <h2>Обробки за сезон ${v.season}</h2>
    ${tRows ? `<table><tr><th>Дата</th><th>Препарат</th><th>Доза</th><th>Строк очікування</th></tr>${tRows}</table>` : '<p class="m">Не записано.</p>'}
    ${phases ? `<h2>Фенофази</h2><p>${phases}</p>` : ''}
    ${insp ? `<h2>Огляди агронома</h2><ul>${insp}</ul>` : ''}
    <p class="m" style="margin-top:24px">Складено з журналу фермера в АгроПросторі ${dmy(today)}.</p>
    <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`)
  w.document.close()
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  uid.value = session?.user?.id || ''
  await load()
  if (p.value) {
    const other = uid.value === p.value.deal.buyer_id ? p.value.deal.farmer_id : p.value.deal.buyer_id
    const { data: pp } = await supabase.from('public_profiles').select('name').eq('id', other).maybeSingle()
    otherName.value = pp?.name || ''
  }
  loading.value = false
})
</script>

<style scoped>
.pp-h { font-family: 'Bitter', Georgia, serif; font-size: 16px; font-weight: 800; color: rgb(27, 46, 27); }
.pp-banner { padding: 14px 16px; border-radius: 14px; border: 1px solid rgb(214, 224, 196); background: rgb(238, 241, 227); color: rgb(27, 46, 27); }
.pp-banner[data-status="ok"] { background: rgb(236, 246, 234); border-color: rgb(190, 222, 184); color: rgb(30, 80, 36); }
.pp-banner[data-status="violated"] { background: rgb(254, 242, 242); border-color: rgb(252, 202, 202); color: rgb(153, 27, 27); }
.pp-dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; font-size: 14px; }
.pp-dl dt { color: rgb(110, 125, 100); }
.pp-dl dd { color: rgb(27, 46, 27); margin: 0; }
.pp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.pp-table th { text-align: left; font-size: 12px; font-weight: 600; color: rgb(110, 125, 100); padding: 6px 8px; border-bottom: 1px solid rgb(226, 232, 214); }
.pp-table td { padding: 8px; border-bottom: 1px solid rgb(238, 241, 227); vertical-align: top; }
.pp-sub { display: block; font-size: 12px; color: rgb(110, 125, 100); }
</style>

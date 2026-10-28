// Порівняння моделей чату AI агронома на наборі питань фермерів (tests/eval/chat-questions.json).
// Той самий системний промпт і параметри, що й на сайті (effort low, max_tokens 1500, кеш промпту).
// Запуск: set -a; source .env; set +a; npx vite-node scripts/eval-chat.ts [out-dir] [model ...]
// Пише results.json і results.csv: відповідь, токени (зокрема приховані міркування), вартість, препарати з каталогу.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { CHAT_SYSTEM_PROMPT } from '../server/utils/chatPrompt'
import { aiCostUsd, MODEL_PRICES } from '../server/utils/aiConfig'
import { getCatalog, matchMentions } from '../server/utils/agroCatalog'
import { uniqueProducts } from '../shared/utils/aiProducts'

const [outDir = 'eval-out', ...argModels] = process.argv.slice(2)
const models = argModels.length ? argModels : ['claude-opus-5-5', 'claude-sonnet-5-5']
for (const m of models) if (!MODEL_PRICES[m]) throw new Error(`Немає ціни для ${m} у MODEL_PRICES`)

const questions: { id: number; q: string; farm: string | null }[] = JSON.parse(readFileSync('tests/eval/chat-questions.json', 'utf8'))
const client = new Anthropic()
const catalog = await getCatalog()
const context = (farm: string | null) => [
  'КОНТЕКСТ ЧАСУ: зараз липень 2026 року, літо. Враховуй це у рекомендаціях — які фази вегетації зараз актуальні, які роботи типові для цього сезону.',
  farm ? `ДАНІ ГОСПОДАРСТВА ФЕРМЕРА:\n${farm}\nВикористовуй цей контекст для персоналізованих порад.` : '',
].filter(Boolean).join('\n\n')

async function ask(model: string, q: { id: number; q: string; farm: string | null }) {
  const started = Date.now()
  const res: any = await client.beta.messages.create({
    model,
    max_tokens: 1500,
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: CHAT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }, { type: 'text', text: context(q.farm) }],
    messages: [{ role: 'user', content: q.q }],
  } as any)
  const text = res.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim()
  const u = res.usage
  const usage = { input: u.input_tokens || 0, output: u.output_tokens || 0, cacheRead: u.cache_read_input_tokens || 0, cacheWrite: u.cache_creation_input_tokens || 0 }
  const products = uniqueProducts(matchMentions(catalog, text)).filter(p => !p.generic)
  return {
    id: q.id, model, text, seconds: (Date.now() - started) / 1000,
    words: text.replace(/SCHEME_DETECTED|REMINDER:[^\n]+/g, '').split(/\s+/).filter(Boolean).length,
    ...usage, thinking: u.output_tokens_details?.thinking_tokens || 0,
    cost: aiCostUsd(model, usage),
    found: products.filter(p => p.found).map(p => p.name),
    unknown: products.filter(p => !p.found).map(p => p.name),
  }
}

// По 4 запити паралельно — не впираємося в ліміти API
const jobs = questions.flatMap(q => models.map(m => () => ask(m, q)))
const results: Awaited<ReturnType<typeof ask>>[] = []
for (let i = 0; i < jobs.length; i += 4) {
  const batch = await Promise.all(jobs.slice(i, i + 4).map(j => j().catch((e) => { console.error(e?.message || e); return null })))
  results.push(...batch.filter(Boolean) as any)
  console.log(`${Math.min(i + 4, jobs.length)}/${jobs.length}`)
}

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'results.json'), JSON.stringify({ questions, results }, null, 1))
const csv = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
writeFileSync(join(outDir, 'results.csv'), [
  'id,model,words,input,output,thinking,cache_read,cache_write,cost_usd,found,unknown,answer',
  ...results.map(r => [r.id, r.model, r.words, r.input, r.output, r.thinking, r.cacheRead, r.cacheWrite, r.cost.toFixed(5), csv(r.found.join('; ')), csv(r.unknown.join('; ')), csv(r.text)].join(',')),
].join('\n'))

for (const m of models) {
  const rs = results.filter(r => r.model === m)
  const avg = (k: 'cost' | 'output' | 'thinking' | 'words' | 'seconds') => rs.reduce((s, r) => s + r[k], 0) / (rs.length || 1)
  const found = rs.reduce((s, r) => s + r.found.length, 0), unknown = rs.reduce((s, r) => s + r.unknown.length, 0)
  console.log(`${m}: ${rs.length} відп., $${avg('cost').toFixed(4)}/відп., вихід ${avg('output').toFixed(0)} (міркування ${avg('thinking').toFixed(0)}), ${avg('words').toFixed(0)} слів, ${avg('seconds').toFixed(1)} с, препарати ${found} в каталозі / ${unknown} ні`)
}

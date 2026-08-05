<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <NuxtLink to="/pesticides" class="inline-flex items-center gap-2 text-agro-light hover:text-agro mb-8 text-sm font-medium">
      ← Назад до каталогу
    </NuxtLink>

    <!-- Заголовок бренду -->
    <div class="card mb-8 flex items-center gap-6">
      <div class="w-16 h-16 rounded-2xl bg-agro-hover flex items-center justify-center shrink-0"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgb(107,122,100)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg></div>
      <div>
        <p class="text-xs text-agro-light uppercase tracking-wider mb-1">Виробник</p>
        <h1 class="text-2xl font-extrabold text-agro-dark">{{ brand?.name || slug }}</h1>
        <p v-if="brand?.country" class="text-agro-light text-sm mt-1 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.7" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:2px"><path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.3" stroke-width="1.5"/></svg> {{ brand.country }}</p>
      </div>
      <div v-if="brand?.website_url" class="ml-auto">
        <a :href="brand.website_url" target="_blank" class="btn-outline text-sm py-2">Сайт →</a>
      </div>
    </div>

    <!-- Завантаження -->
    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="card animate-pulse">
        <div class="h-4 bg-agro-bg rounded w-3/4 mb-3"></div>
        <div class="h-3 bg-agro-bg rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-agro-bg rounded w-full"></div>
      </div>
    </div>

    <!-- Товари -->
    <div v-else>
      <p class="text-agro-light text-sm mb-5">Знайдено товарів: {{ products.length }}</p>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div v-for="product in products" :key="product.slug" class="card hover:shadow-md transition-all group">
          <NuxtLink :to="`/pesticides/${product.slug}`" class="block">
            <div class="flex items-center justify-between mb-3">
              <span class="w-8 h-8 flex items-center justify-center" v-html="typeIcon(product.type)"></span>
              <span class="text-xs font-semibold bg-agro-hover text-agro px-2.5 py-1 rounded-full">
                {{ TYPE_LABELS[product.type] || product.type }}
              </span>
            </div>
            <h3 class="font-bold text-agro-dark group-hover:text-agro transition-colors mb-1 line-clamp-2">
              {{ product.name }}
            </h3>
          </NuxtLink>

          <div class="border-t border-agro-border pt-4 mt-4 flex items-center justify-between gap-2">
            <template v-if="MARKETPLACE">
              <div v-if="offersMap[product.slug]?.length">
                <p class="text-xs text-agro-light">від</p>
                <p class="font-bold text-agro text-lg leading-none">
                  {{ Math.min(...offersMap[product.slug].map((o: any) => o.price)) }} грн
                </p>
              </div>
              <p v-else class="text-sm text-agro-light">Немає пропозицій</p>
            </template>
            <div class="flex gap-2 shrink-0" :class="MARKETPLACE ? '' : 'ml-auto'">
              <NuxtLink :to="`/pesticides/${product.slug}`" class="btn-outline text-sm py-2 px-3">Детально</NuxtLink>
              <button v-if="MARKETPLACE && offersMap[product.slug]?.length" @click="openBuyModal(product)" class="btn-primary text-sm py-2 px-3">🛒 Купити</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="mt-8 text-center">
        <button @click="loadMore" :disabled="loadingMore" class="btn-outline">
          {{ loadingMore ? 'Завантаження...' : 'Завантажити ще' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Модалка продавців (маркетплейс) -->
  <Teleport v-if="MARKETPLACE" to="body">
    <Transition name="fade">
      <div v-if="buyModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="buyModalOpen = false" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
          <div class="flex items-start justify-between px-6 py-5 border-b border-agro-border">
            <div>
              <p class="text-xs text-agro-light mb-1">Пропозиції продавців</p>
              <h3 class="font-bold text-agro-dark text-lg">{{ buyModalProduct?.name }}</h3>
            </div>
            <button @click="buyModalOpen = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-bg text-agro-light ml-3">✕</button>
          </div>
          <div class="px-4 py-3 space-y-2 max-h-80 overflow-y-auto">
            <div v-for="offer in buyModalOffers" :key="offer.id" class="flex items-center justify-between border border-agro-border rounded-xl px-4 py-3 hover:border-agro transition-colors">
              <div>
                <p class="font-bold text-agro text-xl leading-none mb-1">{{ offer.price }} грн</p>
                <p class="text-sm font-semibold text-agro-dark">{{ offer.seller_profiles?.company_name }}</p>
                <p v-if="offer.seller_profiles?.region" class="text-xs text-agro-light mt-0.5 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.7" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:2px"><path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.3" stroke-width="1.5"/></svg> {{ offer.seller_profiles.region }}</p>
              </div>
              <button @click="addToCart(offer.id)" :disabled="addingId === offer.id" class="btn-primary text-sm py-2.5 px-5 shrink-0 ml-4">
                {{ addingId === offer.id ? '...' : 'В кошик' }}
              </button>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-agro-border">
            <NuxtLink :to="`/pesticides/${buyModalProduct?.slug}`" @click="buyModalOpen = false" class="text-agro text-sm font-semibold hover:underline">
              Детальніше про товар →
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const MARKETPLACE = false

const route = useRoute()
const slug = route.params.slug as string
const api = useAgroApi()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { brandToSlug } = await import('~/utils/cropSlugs')

const LEAF_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/><path d="M12 12c0 0 5-3 7-7-4 0-6 2-7 7z"/></svg>'
const typeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    herbicide: LEAF_SVG,
    fungicide: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    insecticide: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="5" ry="6"/><path d="M12 7V3"/><path d="M7 14H4M20 14h-3"/><path d="M8.5 20L6 22M15.5 20L18 22"/></svg>',
    fertilizer: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z"/></svg>',
    liquid_complex_fertilizer: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z"/></svg>',
    seed: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="5"/><path d="M12 8V4M9 6l3-3 3 3"/></svg>',
    growth_regulator: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    rodenticide: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    adjuvant: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>',
    seed_treatment: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>',
    desiccant: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41"/></svg>',
    biostimulator: LEAF_SVG,
    bio_product: LEAF_SVG,
    biofungicide: LEAF_SVG,
    inoculant: LEAF_SVG,
  }
  return icons[type] || LEAF_SVG
}

const TYPE_LABELS: Record<string, string> = {
  herbicide: 'Гербіцид', fungicide: 'Фунгіцид', insecticide: 'Інсектицид',
  fertilizer: 'Добриво', seed: 'Насіння', growth_regulator: 'Регулятор росту',
  rodenticide: 'Родентицид', biostimulator: 'Біостимулятор', seed_treatment: 'Протруювач',
  bio_product: 'Біопрепарат', biofungicide: 'Біофунгіцид', liquid_complex_fertilizer: 'РКД',
}

const loadingMore = ref(false)
const offersMap = ref<Record<string, any[]>>({})
const page = ref(1)

// useLazyAsyncData — одразу переходить на сторінку, показує скелетон поки дані завантажуються
const { data: brandData, pending } = useLazyAsyncData(`brand-${slug}`, async () => {
  const [brandsRes, productsRes] = await Promise.all([
    $fetch('/api/brands').catch(() => ({ items: [] })),
    api.getProducts({ manufacturer: slug, page: 1, limit: 20 }).catch(() => ({ items: [] })),
  ])
  const brand = (brandsRes.items || []).find((b: any) => brandToSlug(b) === slug) || null
  const items = Array.isArray(productsRes) ? productsRes : (productsRes.items || [])
  return { brand, items }
})

const brand = computed(() => brandData.value?.brand || null)
const products = ref<any[]>([])
const hasMore = ref(false)
const loading = computed(() => pending.value)

watch(brandData, (val) => {
  if (!val) return
  products.value = val.items || []
  hasMore.value = (val.items || []).length === 20
}, { immediate: true })

useSeoMeta({
  title: `${brand.value?.name || slug} — препарати виробника`,
  description: `Всі препарати і добрива від ${brand.value?.name || slug}. Купити онлайн з доставкою.`,
})

const loadProducts = async (p: number) => {
  loadingMore.value = true

  const data = await api.getProducts({ manufacturer: brand.value?.slug || slug, page: p, limit: 20 }).catch(() => ({ items: [] }))
  const items = Array.isArray(data) ? data : (data.items || [])

  products.value.push(...items)
  hasMore.value = items.length === 20
  page.value = p

  if (MARKETPLACE && items.length > 0) {
    const slugs = items.map((p: any) => p.slug).filter(Boolean)
    const { data: offers } = await supabase
      .from('seller_offers')
      .select('id, price, product_slug, seller_profiles(company_name, region)')
      .in('product_slug', slugs)
      .eq('in_stock', true)

    if (offers) {
      const map: Record<string, any[]> = { ...offersMap.value }
      for (const offer of offers) {
        if (!map[offer.product_slug]) map[offer.product_slug] = []
        map[offer.product_slug].push(offer)
      }
      offersMap.value = map
    }
  }

  loading.value = false
  loadingMore.value = false
}

const loadMore = () => loadProducts(page.value + 1)

// Модалка
const buyModalOpen = ref(false)
const buyModalProduct = ref<any>(null)
const buyModalOffers = ref<any[]>([])
const addingId = ref('')

const openBuyModal = (product: any) => {
  buyModalProduct.value = product
  buyModalOffers.value = offersMap.value[product.slug] || []
  buyModalOpen.value = true
}

const addToCart = async (offerId: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { navigateTo('/auth'); return }
  addingId.value = offerId
  await supabase.from('cart_items').upsert({ user_id: session.user.id, offer_id: offerId, quantity: 1 }, { onConflict: "user_id,offer_id" })
  addingId.value = ''
  buyModalOpen.value = false
}

</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

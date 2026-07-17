<template>
  <div class="min-h-screen bg-agro-bg flex flex-col items-center justify-center px-4">
    <div class="text-center max-w-md">

      <div class="text-7xl mb-6">{{ is404 ? '🌾' : '⚠️' }}</div>

      <h1 class="text-6xl font-extrabold text-agro-dark mb-2">{{ error.statusCode }}</h1>

      <p class="text-xl font-semibold text-agro-dark mb-2">
        {{ is404 ? 'Сторінку не знайдено' : 'Щось пішло не так' }}
      </p>

      <p class="text-agro-light mb-8">
        {{ is404
          ? 'Можливо, посилання застаріло або сторінку було видалено.'
          : 'Виникла технічна помилка. Спробуйте оновити сторінку або поверніться пізніше.'
        }}
      </p>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <NuxtLink to="/" class="btn-primary">
          На головну
        </NuxtLink>
        <button v-if="!is404" @click="reload" class="btn-outline">
          Оновити сторінку
        </button>
        <NuxtLink v-else to="/catalog" class="btn-outline">
          До каталогу
        </NuxtLink>
      </div>

      <p v-if="!is404" class="text-xs text-agro-light mt-8 font-mono opacity-60">
        Помилка {{ error.statusCode }}: {{ error.message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message?: string } }>()

const is404 = computed(() => props.error.statusCode === 404)

const reload = () => window.location.reload()

useHead({
  title: computed(() => is404.value ? '404 — Сторінку не знайдено' : `${props.error.statusCode} — Помилка`),
})
</script>

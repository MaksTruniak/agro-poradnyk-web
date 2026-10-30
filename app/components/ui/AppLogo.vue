<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="shrink-0">
    <!-- Знак «Три ролі в кварталах»: поле — фермер, листок — агроном, плід — заготівельник, порожній квартал — простір між ними -->
    <rect x="2.8" y="2.8" width="8.2" height="8.2" rx="2.4" :fill="c.main" />
    <path d="M13 11c0-5 3.1-8.2 8.2-8.2 0 5.1-3.2 8.2-8.2 8.2z" :fill="c.leaf" />
    <path d="M13.3 10.7l4.6-4.6" :stroke="cut" stroke-width="1.1" stroke-linecap="round" />
    <circle cx="6.9" cy="17.1" r="4.2" :fill="c.fruit" />
    <rect x="13.9" y="13.9" width="6.4" height="6.4" rx="1.9" :stroke="c.main" stroke-width="1.8" />
  </svg>
</template>

<script setup lang="ts">
// tone: light — знак на світлому тлі, dark — на темно-зеленому; cut — колір тла (прожилка листка)
const props = withDefaults(defineProps<{ size?: number; tone?: 'light' | 'dark'; cut?: string }>(), { size: 30, tone: 'light' })
const c = computed(() => props.tone === 'dark'
  ? { main: '#FAF6EC', leaf: '#A8CC84', fruit: '#E8835F' }
  : { main: '#2F5233', leaf: '#7FA35B', fruit: '#C2563A' })
const cut = computed(() => props.cut || (props.tone === 'dark' ? '#2F5233' : '#FFFFFF'))
</script>

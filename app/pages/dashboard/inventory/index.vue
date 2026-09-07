<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Склад</h1>
        <p class="dash-subtitle">Облік ресурсів господарства</p>
      </div>
    </div>

    <div class="grid sm:grid-cols-3 gap-4">
      <NuxtLink v-for="section in sections" :key="section.to" :to="section.to"
        class="card hover:border-agro border-2 border-transparent transition-all group cursor-pointer flex flex-col gap-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center" :style="`background:${section.bg}`">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" :stroke="section.color" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path v-for="(p, i) in section.paths" :key="i" :d="p" />
            <circle v-for="(c, i) in (section.circles||[])" :key="'c'+i" :cx="c[0]" :cy="c[1]" :r="c[2]" :stroke="section.color" stroke-width="1.7"/>
          </svg>
        </div>
        <div>
          <p class="font-bold text-agro-dark text-lg group-hover:text-agro transition-colors">{{ section.title }}</p>
          <p class="text-sm text-agro-light mt-1">{{ section.desc }}</p>
        </div>
        <div class="mt-auto flex items-center gap-1 text-sm font-semibold text-agro opacity-0 group-hover:opacity-100 transition-opacity">
          Відкрити
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Склад — Кабінет' })

const sections = [
  {
    to: '/dashboard/inventory/chemicals',
    title: 'Препарати і добрива',
    desc: 'Залишки ЗЗР, добрив та інших хімікатів',
    bg: 'rgb(234,240,222)',
    color: 'rgb(47,82,51)',
    paths: ['M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18'],
  },
  {
    to: '/dashboard/inventory/fuel',
    title: 'Пальне',
    desc: 'Облік дизелю, бензину та витрат по техніці',
    bg: 'rgb(255,247,230)',
    color: 'rgb(180,100,20)',
    paths: ['M3 22V10l9-8 9 8v12', 'M12 22v-6', 'M8 22v-4h8v4'],
  },
  {
    to: '/dashboard/inventory/equipment',
    title: 'Техніка',
    desc: 'Трактори, комбайни, стан та технічне обслуговування',
    bg: 'rgb(235,240,255)',
    color: 'rgb(60,80,180)',
    paths: ['M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5a2 2 0 00-2 2v7h2'],
    circles: [[7.5, 18, 1.5], [17.5, 18, 1.5]],
  },
]
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
</style>

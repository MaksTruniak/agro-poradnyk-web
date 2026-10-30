<template>
  <section class="px-4 sm:px-14 py-[90px]">
    <div class="max-w-[1180px] mx-auto">
      <div class="text-center mb-14 max-w-2xl mx-auto">
        <h2 class="bitter text-[32px] sm:text-[38px] font-bold text-[rgb(27,46,27)] mb-3">Що ви можете і що отримуєте</h2>
        <p class="text-base text-[rgb(91,107,83)]">{{ subtitle }}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="g in groups" :key="g.title" class="feature-card">
          <div class="flex items-start gap-4 mb-4">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] text-[#2F5233] flex items-center justify-center" v-html="icon(g.icon)" />
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-[18px] font-bold text-[rgb(27,46,27)]">{{ g.title }}</h3>
                <span v-if="g.plan" class="plan-badge">{{ g.plan }}</span>
              </div>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)] mt-1">{{ g.lead }}</p>
            </div>
          </div>
          <ul class="flex flex-col gap-2.5 mb-5">
            <li v-for="item in g.can" :key="item" class="flex gap-2.5 items-start text-[14px] leading-relaxed text-[rgb(62,79,59)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="shrink-0 mt-[3px]"><circle cx="12" cy="12" r="10" fill="#2F5233"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>{{ item }}</span>
            </li>
          </ul>
          <p class="feature-result"><b>Що отримуєте:</b> {{ g.result }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Картки можливостей на сторінках для ролей: що можна робити і що з цього отримуєш.
// icon — внутрішність SVG 24×24 (path/circle), обгортка однакова для всіх
interface RoleFeature { icon: string; title: string; plan?: string; lead: string; can: string[]; result: string }
defineProps<{ subtitle: string; groups: RoleFeature[] }>()
const icon = (d: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.feature-card {
  background: #fff;
  border: 1px solid rgb(225, 219, 198);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.feature-card ul { flex: 1; }
.feature-result {
  font-size: 14px;
  line-height: 1.55;
  color: rgb(47, 82, 51);
  background: rgb(238, 241, 227);
  border-radius: 12px;
  padding: 12px 14px;
}
.plan-badge {
  font-size: 11.5px;
  font-weight: 800;
  color: #8a5a12;
  background: #fbf0db;
  border-radius: 999px;
  padding: 2px 9px;
}
@media (max-width: 640px) { .feature-card { padding: 20px; } }
</style>

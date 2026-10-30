<template>
  <section class="px-4 sm:px-14 py-[90px] bg-[rgb(238,241,227)]">
    <div class="max-w-[920px] mx-auto">
      <div class="text-center mb-14">
        <h2 class="bitter text-[32px] sm:text-[38px] font-bold text-[rgb(27,46,27)] mb-3">Як це працює</h2>
        <p class="text-base text-[rgb(91,107,83)]">{{ subtitle }}</p>
      </div>
      <div class="flex flex-col gap-10">
        <div v-for="(step, i) in steps" :key="step.title" class="flex gap-5 sm:gap-6">
          <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">{{ i + 1 }}</div>
          <div>
            <h3 class="text-[18px] font-bold text-[rgb(27,46,27)] mb-2">{{ step.title }}</h3>
            <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">{{ step.desc }}</p>
            <div class="flex flex-wrap gap-2.5">
              <span v-for="tag in step.tags" :key="tag" class="step-tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Блок «Як це працює» на сторінках для ролей (фермер, агроном, заготівельник)
defineProps<{ subtitle: string; steps: { title: string; desc: string; tags: string[] }[] }>()
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.step-tag {
  padding: 7px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgb(225, 219, 198);
  font-size: 13px;
  font-weight: 600;
  color: rgb(62, 79, 59);
}
</style>

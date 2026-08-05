<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="state.open" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cancel" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
          <div class="px-6 pt-6 pb-5">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              :class="state.danger ? 'bg-red-50' : 'bg-agro-hover'">
              <svg v-if="state.danger" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16l-1.5 12.5a1 1 0 01-1 .9H6.5a1 1 0 01-1-.9L4 7z"/><path d="M8 7a4 4 0 018 0"/></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(180,130,40)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 class="font-bold text-agro-dark text-base mb-1">{{ state.title }}</h3>
            <p class="text-sm text-agro-light leading-relaxed">{{ state.message }}</p>
          </div>
          <div class="flex gap-2 px-6 pb-5">
            <button @click="cancel" class="btn-outline flex-1">Скасувати</button>
            <button @click="accept"
              class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              :class="state.danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-primary'">
              {{ state.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { state, accept, cancel } = useConfirm()
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

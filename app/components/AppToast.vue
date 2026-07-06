<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style="max-width: 360px; width: calc(100vw - 2rem)">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium"
          :class="{
            'bg-red-500 text-white': t.type === 'error',
            'bg-[#3B6D11] text-white': t.type === 'success',
            'bg-agro-dark text-white': t.type === 'info',
          }"
        >
          <span class="text-base shrink-0 mt-0.5">
            {{ t.type === 'error' ? '⚠️' : t.type === 'success' ? '✓' : 'ℹ️' }}
          </span>
          <span class="flex-1 leading-snug">{{ t.message }}</span>
          <button @click="dismiss(t.id)" class="opacity-70 hover:opacity-100 transition-opacity shrink-0 mt-0.5">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts } = useToast()

const dismiss = (id: number) => {
  const { toasts: list } = useToast()
  list.value = list.value.filter(t => t.id !== id)
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
</style>

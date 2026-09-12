<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
        @mousedown.self="$emit('update:modelValue', false)"
      >
        <div
          class="bg-white rounded-2xl w-full shadow-xl"
          :class="maxWidth"
          style="max-height: 90vh; overflow-y: auto;"
          @mousedown.stop
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  maxWidth?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const maxWidth = computed(() => props.maxWidth ?? 'max-w-md')

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) emit('update:modelValue', false)
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active > div, .modal-leave-active > div { transition: transform .15s; }
.modal-enter-from > div, .modal-leave-to > div { transform: translateY(16px); }
</style>

<template>
  <div class="relative" ref="root">
    <button
      type="button"
      @click="open = !open"
      class="flex items-center justify-between gap-2 w-full px-4 py-2.5 rounded-xl border border-agro-border bg-white text-sm text-agro-dark hover:border-agro/50 transition-colors"
      :class="open ? 'border-agro ring-2 ring-agro/10' : ''"
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round"
        class="shrink-0 text-agro-light transition-transform"
        :class="open ? 'rotate-180' : ''"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <Transition name="drop">
      <div
        v-if="open"
        class="absolute z-50 mt-1.5 w-full min-w-[160px] bg-white border border-agro-border rounded-xl shadow-lg overflow-hidden"
        :class="dropUp ? 'bottom-full mb-1.5 top-auto' : ''"
      >
        <div class="max-h-56 overflow-y-auto py-1">
          <button
            v-for="opt in options" :key="opt.value"
            type="button"
            @click="select(opt.value)"
            class="flex items-center justify-between w-full px-4 py-2.5 text-sm text-left hover:bg-agro-hover transition-colors"
            :class="opt.value === modelValue ? 'text-agro font-semibold bg-agro/5' : 'text-agro-dark'"
          >
            {{ opt.label }}
            <svg v-if="opt.value === modelValue" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number
  options: { value: string | number; label: string }[]
  dropUp?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [v: string | number] }>()

const open = ref(false)
const root = ref<HTMLElement>()

const selectedLabel = computed(
  () => props.options.find(o => o.value === props.modelValue)?.label ?? ''
)

function select(val: string | number) {
  emit('update:modelValue', val)
  open.value = false
}

onMounted(() => {
  document.addEventListener('click', onOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onOutside)
})
function onOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
</script>

<style scoped>
.drop-enter-active, .drop-leave-active { transition: opacity .12s, transform .12s; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>

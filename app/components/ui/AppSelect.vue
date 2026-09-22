<template>
  <div class="relative" ref="root">
    <button
      type="button"
      @click="toggle"
      style="background-color: white; border: 1px solid #D4E8B8; color: #1A3A06;"
      class="flex items-center justify-between gap-2 w-full px-4 py-2.5 rounded-xl text-sm hover:border-agro/50 transition-colors"
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

    <Teleport to="body">
      <Transition name="drop">
        <div
          v-if="open"
          :style="dropdownStyle"
          class="fixed z-[9999] min-w-[160px] bg-white border border-agro-border rounded-xl shadow-lg overflow-hidden"
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
    </Teleport>
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
const dropdownStyle = ref({})

const selectedLabel = computed(
  () => props.options.find(o => o.value === props.modelValue)?.label ?? ''
)

function toggle() {
  open.value = !open.value
  if (open.value) nextTick(updatePosition)
}

function updatePosition() {
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const useDropUp = props.dropUp || spaceBelow < 240 && spaceAbove > spaceBelow

  if (useDropUp) {
    dropdownStyle.value = {
      left: rect.left + 'px',
      width: rect.width + 'px',
      bottom: (window.innerHeight - rect.top) + 4 + 'px',
    }
  } else {
    dropdownStyle.value = {
      left: rect.left + 'px',
      width: rect.width + 'px',
      top: rect.bottom + 4 + 'px',
    }
  }
}

function select(val: string | number) {
  emit('update:modelValue', val)
  open.value = false
}

onMounted(() => {
  document.addEventListener('click', onOutside)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', updatePosition)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onOutside)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', updatePosition)
})
function onOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onScroll() {
  if (open.value) updatePosition()
}
</script>

<style scoped>
.drop-enter-active, .drop-leave-active { transition: opacity .12s, transform .12s; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>

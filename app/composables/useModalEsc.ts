export function useModalEsc(isOpen: Ref<boolean>) {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen.value) isOpen.value = false
  }
  onMounted(() => document.addEventListener('keydown', onKey))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
}

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppToast />
</template>

<script setup lang="ts">
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' },
  ],
})

// Глобальне закриття модалок: ESC і клік на backdrop
onMounted(() => {
  function getTopModal(): HTMLElement | null {
    const backdrops = document.querySelectorAll<HTMLElement>('.modal-backdrop')
    return backdrops.length ? backdrops[backdrops.length - 1] : null
  }

  function closeModal(modal: HTMLElement) {
    // 1. data-modal-close або modal-close клас
    let btn = modal.querySelector<HTMLElement>('[data-modal-close], button.modal-close')
    // 2. Перша кнопка в першому дочірньому div (заголовок модалки)
    if (!btn) {
      const inner = modal.querySelector<HTMLElement>(':scope > div')
      if (inner) btn = inner.querySelector<HTMLElement>('button')
    }
    if (btn) btn.click()
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') { const m = getTopModal(); if (m) closeModal(m) }
  })

  document.addEventListener('mousedown', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('modal-backdrop')) closeModal(target)
  })
})
</script>

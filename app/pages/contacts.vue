<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-extrabold text-agro-dark mb-4">Контакти</h1>
      <p class="text-agro-light text-lg">Маєте питання? Ми завжди раді допомогти</p>
    </div>

    <!-- Реквізити -->
    <div class="card mb-6">
      <h2 class="font-bold text-agro-dark text-base mb-4">Реквізити організації</h2>
      <div class="space-y-2 text-sm text-agro-light">
        <div class="flex gap-2"><span class="text-agro-dark font-medium w-40 shrink-0">Повна назва:</span><span>ФОП Труняк Максим Сергійович</span></div>
        <div class="flex gap-2"><span class="text-agro-dark font-medium w-40 shrink-0">ІПН:</span><span>3402206173</span></div>
        <div class="flex gap-2"><span class="text-agro-dark font-medium w-40 shrink-0">Юридична адреса:</span><span>Україна, Львівська область, с. Нагачів, вул. Лесі Українки, 1</span></div>
        <div class="flex gap-2"><span class="text-agro-dark font-medium w-40 shrink-0">Телефон:</span><a href="tel:+380631817169" class="text-agro hover:underline">+38 063 181 71 69</a></div>
        <div class="flex gap-2"><span class="text-agro-dark font-medium w-40 shrink-0">Email:</span><a href="mailto:info@agroprostir.ua" class="text-agro hover:underline">info@agroprostir.ua</a></div>
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-6 mb-12">
      <div class="card text-center">
        <div class="w-12 h-12 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <h3 class="font-bold text-agro-dark mb-1">Email</h3>
        <a href="mailto:info@agroprostir.ua" class="text-agro hover:underline">info@agroprostir.ua</a>
      </div>
      <div class="card text-center">
        <div class="w-12 h-12 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.13 1.22 2 2 0 012.1 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z"/></svg>
        </div>
        <h3 class="font-bold text-agro-dark mb-1">Телефон</h3>
        <a href="tel:+380631817169" class="text-agro hover:underline">+38 063 181 71 69</a>
      </div>
      <div class="card text-center">
        <div class="w-12 h-12 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>
        <h3 class="font-bold text-agro-dark mb-1">Telegram</h3>
        <a href="https://t.me/agroprostir" target="_blank" class="text-agro hover:underline">@agroprostir</a>
      </div>
    </div>

    <div class="card">
      <h2 class="font-bold text-agro-dark text-lg mb-5">Написати нам</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-agro-dark mb-1.5">Ім'я</label>
          <input v-model="form.name" class="input" placeholder="Ваше ім'я" />
        </div>
        <div>
          <label class="block text-sm font-medium text-agro-dark mb-1.5">Email</label>
          <input v-model="form.email" type="email" class="input" placeholder="email@example.com" />
        </div>
        <div>
          <label class="block text-sm font-medium text-agro-dark mb-1.5">Повідомлення</label>
          <textarea v-model="form.message" class="input resize-none" rows="4" placeholder="Ваше питання або пропозиція..." />
        </div>
        <p v-if="sent" class="text-agro text-sm font-medium flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Повідомлення відправлено! Ми відповімо протягом 24 годин.</p>
        <button @click="send" :disabled="sending || !form.name || !form.email || !form.message" class="btn-primary">
          {{ sending ? 'Відправляємо...' : 'Відправити' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Контакти — АгроПростір' })

const form = reactive({ name: '', email: '', message: '' })
const sending = ref(false)
const sent = ref(false)

const send = async () => {
  sending.value = true
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: { name: form.name, email: form.email, message: form.message },
    })
    sent.value = true
    Object.assign(form, { name: '', email: '', message: '' })
  } catch {
    alert('Помилка відправки. Спробуйте написати нам напряму на info@agroprostir.com.ua')
  } finally {
    sending.value = false
  }
}
</script>

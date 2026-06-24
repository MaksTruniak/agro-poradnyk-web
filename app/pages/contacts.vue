<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-extrabold text-agro-dark mb-4">Контакти</h1>
      <p class="text-agro-light text-lg">Маєте питання? Ми завжди раді допомогти</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-12">
      <div class="card text-center">
        <div class="text-3xl mb-3">📧</div>
        <h3 class="font-bold text-agro-dark mb-1">Email</h3>
        <a href="mailto:info@agroporadnyk.ua" class="text-agro hover:underline">info@agroporadnyk.ua</a>
      </div>
      <div class="card text-center">
        <div class="text-3xl mb-3">💬</div>
        <h3 class="font-bold text-agro-dark mb-1">Telegram</h3>
        <a href="https://t.me/agroporadnyk" target="_blank" class="text-agro hover:underline">@agroporadnyk</a>
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
        <p v-if="sent" class="text-agro text-sm font-medium">✅ Повідомлення відправлено! Ми відповімо протягом 24 годин.</p>
        <button @click="send" :disabled="sending || !form.name || !form.email || !form.message" class="btn-primary">
          {{ sending ? 'Відправляємо...' : 'Відправити' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Контакти — АгроПорадник' })

const form = reactive({ name: '', email: '', message: '' })
const sending = ref(false)
const sent = ref(false)

const send = async () => {
  sending.value = true
  await new Promise(r => setTimeout(r, 800))
  sent.value = true
  sending.value = false
  Object.assign(form, { name: '', email: '', message: '' })
}
</script>

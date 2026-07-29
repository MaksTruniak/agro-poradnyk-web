<template>
  <img v-if="cleanUrl" :src="cleanUrl" :alt="alt" :class="imgClass" loading="lazy" />
  <span v-else :class="fallbackClass">{{ fallbackEmoji }}</span>
</template>

<script setup lang="ts">
import { getProductImageUrl } from '~/utils/productImage'

const props = defineProps<{
  src?: string | null
  alt?: string
  imgClass?: string
  fallbackClass?: string
  fallbackEmoji?: string
}>()

const cleanUrl = computed(() => getProductImageUrl(props.src))
</script>

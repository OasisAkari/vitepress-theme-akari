<script setup lang="ts">
import { onMounted, ref } from 'vue'

const maRef = ref<HTMLElement | null>(null)

onMounted(() => {
    if (maRef.value) {
        maRef.value.setAttribute('id', maRef.value.textContent?.trim() || '')
    }
})

</script>

<template>
    <span class="manual-anchor" ref="maRef">
        <slot></slot>
    </span>
</template>

<style scoped>
.manual-anchor {
    scroll-margin: 128px;
    transition: color 0.3s ease;
}
</style>
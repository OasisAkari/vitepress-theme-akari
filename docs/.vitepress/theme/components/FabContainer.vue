<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { useThemeGlobalStore } from '@vitepress-theme-akari/theme/global';
import { storeToRefs } from 'pinia';
import { useThemeGlobalPersistStore } from '@vitepress-theme-akari/theme/global_persist';

import { computed } from 'vue';


const globalStore = useThemeGlobalStore();
const globalPersistStore = useThemeGlobalPersistStore();

const { windowWidth } = storeToRefs(globalStore)

const positionBottomFabOffset = computed(() => {
    return globalPersistStore.siteNoticeVisible ? (windowWidth.value > 768 ? 100 : 130) : (windowWidth.value > 768 ? 50 : 70)
});

const store = useThemeGlobalStore();

// Props for drawer state.
const props = defineProps<{
    drawerOpen: boolean;
    isMobile: boolean;
}>();

const fabContainerRef = ref<HTMLElement | null>(null);

// Watch for SiteNotice state changes and update FAB position.

// Smoothly animate container position when offset changes.
watch(() => positionBottomFabOffset.value, (newBottom: number) => {
    if (fabContainerRef.value) {
        gsap.to(fabContainerRef.value, {
            bottom: `${newBottom}px`,
            duration: 0.3,
            ease: 'expo.out',
        });
    }
});

// Animate FAB container when mobile drawer opens/closes.
watch(() => props.drawerOpen, (isOpen) => {
    if (!fabContainerRef.value || !props.isMobile) {
        return;
    }
    
    if (isOpen) {
        // Drawer opening: fade out to the right.
        gsap.to(fabContainerRef.value, {
            x: 100,
            opacity: 0,
            duration: 0.2,
            ease: 'power2.out',
        });
    } else {
        // Drawer closing: fade in from the right.
        gsap.fromTo(fabContainerRef.value, {
            x: 100,
            opacity: 0,
        }, {
            x: 0,
            opacity: 1,
            duration: 0.2,
            ease: 'power2.out',
        });
    }
});

onMounted(() => {
    nextTick(() => {
        // Set initial position without animation.
        if (fabContainerRef.value) {
            fabContainerRef.value.style.bottom = `${positionBottomFabOffset.value}px`;
        }
    });
});
</script>

<template>
    <div class="fab-container" ref="fabContainerRef">
        <slot></slot>
    </div>
</template>

<style scoped>
/* Container for all floating action buttons. */
.fab-container {
    position: fixed;
    right: 50px;
    bottom: 100px;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: end;
}

@media screen and (max-width: 768px) {
    .fab-container {
        right: 5px;
    }
}
</style>
